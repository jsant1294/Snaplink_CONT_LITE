// Phase 11 load and multi-office tenant-isolation testing against a real staging deployment.
//
// This performs two things against a live SnapLink Real Estate API v1 deployment:
//   1. A concurrent load test against GET /api/v1/{resource}, reporting latency percentiles,
//      success/error/rate-limit counts, and throughput.
//   2. A black-box cross-tenant isolation check: it lists records with two different tenants'
//      API keys and asserts the returned external IDs never overlap.
//
// This script does not run automatically and is not part of `npm run test:real-estate` — it
// requires a real staging deployment and real scoped API keys, neither of which exist in this
// repository or development sandbox. Configure and run it manually against staging:
//
//   REAL_ESTATE_STAGING_BASE_URL=https://staging.example.com \
//   REAL_ESTATE_STAGING_API_KEY_A=slk_live_... \
//   REAL_ESTATE_STAGING_API_KEY_B=slk_live_... \
//   node scripts/real-estate-staging-load-test.mjs
//
// REAL_ESTATE_STAGING_API_KEY_B must belong to a DIFFERENT tenant than _A for the isolation
// check to mean anything. Omit it to run the load test only.
import "dotenv/config";
import { assertNotProductionAppUrl } from "../lib/local-db-guard.ts";

const baseUrl = (process.env.REAL_ESTATE_STAGING_BASE_URL || "").trim();
const keyA = (process.env.REAL_ESTATE_STAGING_API_KEY_A || "").trim();
const keyB = (process.env.REAL_ESTATE_STAGING_API_KEY_B || "").trim();
const totalRequests = Number(process.env.REAL_ESTATE_STAGING_REQUESTS || 200);
const concurrency = Number(process.env.REAL_ESTATE_STAGING_CONCURRENCY || 20);
const resources = ["properties", "leads", "transactions"];

if (!baseUrl || !keyA) {
  console.error(
    "REAL_ESTATE_STAGING_BASE_URL and REAL_ESTATE_STAGING_API_KEY_A are required.\n" +
    "This tool needs a real staging deployment and a real scoped API key — neither is\n" +
    "available in this repository, so it has not been run against a live environment.\n" +
    "See the header of this file for setup instructions."
  );
  process.exit(1);
}
// This is a load test — it must never point at a real production deployment,
// staging only. Fails closed unless ALLOW_PRODUCTION_DB=yes is explicit.
assertNotProductionAppUrl(baseUrl, "scripts/real-estate-staging-load-test.mjs");

async function timedFetch(url, apiKey) {
  const start = performance.now();
  try {
    const response = await fetch(url, { headers: { authorization: `Bearer ${apiKey}` } });
    await response.arrayBuffer(); // drain body so keep-alive connections are reused fairly
    return { status: response.status, ms: performance.now() - start };
  } catch (error) {
    return { status: 0, ms: performance.now() - start, error: error instanceof Error ? error.message : String(error) };
  }
}

async function runPool(tasks, limit) {
  const results = [];
  let cursor = 0;
  async function worker() {
    while (cursor < tasks.length) {
      const index = cursor++;
      results[index] = await tasks[index]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return Math.round(sorted[index]);
}

async function loadTest() {
  console.log(`\n=== Load test: ${totalRequests} requests, concurrency ${concurrency} ===`);
  const tasks = Array.from({ length: totalRequests }, (_, i) => {
    const resource = resources[i % resources.length];
    return () => timedFetch(`${baseUrl}/api/v1/${resource}?page[limit]=25`, keyA);
  });
  const results = await runPool(tasks, concurrency);
  const durations = results.map(r => r.ms).sort((a, b) => a - b);
  const success = results.filter(r => r.status >= 200 && r.status < 300).length;
  const rateLimited = results.filter(r => r.status === 429).length;
  const errors = results.filter(r => r.status === 0 || r.status >= 500).length;
  const other = results.length - success - rateLimited - errors;
  const totalMs = durations.reduce((a, b) => a + b, 0);
  console.log(`success=${success} rate_limited=${rateLimited} server_errors=${errors} other=${other}`);
  console.log(`latency ms: p50=${percentile(durations, 50)} p95=${percentile(durations, 95)} p99=${percentile(durations, 99)} max=${Math.round(durations.at(-1) || 0)}`);
  console.log(`throughput: ${(results.length / (totalMs / results.length / 1000 * concurrency)).toFixed(1)} req/s (approx, concurrency-adjusted)`);
  const nonRateLimitFailureRate = errors / results.length;
  if (nonRateLimitFailureRate > 0.05) {
    console.error(`FAIL: server/network error rate ${(nonRateLimitFailureRate * 100).toFixed(1)}% exceeds 5% threshold`);
    return false;
  }
  console.log("PASS: error rate within threshold");
  return true;
}

async function listAllIds(apiKey) {
  const ids = new Set();
  for (const resource of resources) {
    let cursor = null;
    do {
      const url = new URL(`${baseUrl}/api/v1/${resource}`);
      url.searchParams.set("page[limit]", "100");
      if (cursor) url.searchParams.set("page[cursor]", cursor);
      const response = await fetch(url, { headers: { authorization: `Bearer ${apiKey}` } });
      if (!response.ok) break;
      const body = await response.json();
      for (const row of body.data || []) ids.add(`${resource}:${row.id}`);
      cursor = body.links?.next || null;
    } while (cursor);
  }
  return ids;
}

async function isolationTest() {
  if (!keyB) {
    console.log("\n=== Tenant isolation check: skipped (REAL_ESTATE_STAGING_API_KEY_B not set) ===");
    return true;
  }
  console.log("\n=== Multi-tenant isolation check ===");
  const [idsA, idsB] = await Promise.all([listAllIds(keyA), listAllIds(keyB)]);
  const overlap = [...idsA].filter(id => idsB.has(id));
  console.log(`tenant A records: ${idsA.size}, tenant B records: ${idsB.size}, overlap: ${overlap.length}`);
  if (overlap.length > 0) {
    console.error(`FAIL: cross-tenant data leak — ${overlap.length} record(s) visible to both API keys:`, overlap.slice(0, 10));
    return false;
  }
  console.log("PASS: no record was visible to both tenants' API keys");
  return true;
}

const loadOk = await loadTest();
const isolationOk = await isolationTest();
process.exit(loadOk && isolationOk ? 0 : 1);
