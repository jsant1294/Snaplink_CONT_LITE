import test from "node:test";
import assert from "node:assert/strict";
import { isUsZip, normalizeZip, haversineMiles } from "../lib/geo/zip.ts";

test("normalizeZip trims, collapses ZIP+4, and tolerates empty input", () => {
  assert.equal(normalizeZip("  30005  "), "30005");
  assert.equal(normalizeZip("30005-1234"), "30005");
  assert.equal(normalizeZip("30005-1234 "), "30005");
  assert.equal(normalizeZip(null), "");
  assert.equal(normalizeZip(undefined), "");
  assert.equal(normalizeZip(""), "");
});

test("isUsZip requires exactly five digits after normalization", () => {
  assert.equal(isUsZip("30005"), true);
  assert.equal(isUsZip("30005-1234"), true);
  assert.equal(isUsZip(" 78702 "), true);
  assert.equal(isUsZip("3000"), false);
  assert.equal(isUsZip("300055"), false);
  assert.equal(isUsZip("abcde"), false);
  assert.equal(isUsZip(""), false);
  assert.equal(isUsZip(null), false);
});

test("haversineMiles is deterministic, symmetric, and zero at the same point", () => {
  const a = haversineMiles(34.079, -84.229, 34.119, -84.287);
  const b = haversineMiles(34.119, -84.287, 34.079, -84.229);
  assert.equal(a, b);
  assert.ok(Math.abs(a - 4.3) < 0.5, `30005↔30004 ≈ 4.3 mi, got ${a}`);
  assert.equal(haversineMiles(34.079, -84.229, 34.079, -84.229), 0);
  const deg = haversineMiles(34, -84, 35, -84);
  assert.ok(Math.abs(deg - 69.1) < 0.3, `one degree latitude ≈ 69 mi, got ${deg}`);
  const eq = haversineMiles(0, 0, 0, 0.5);
  assert.ok(Math.abs(eq - 34.6) < 0.5, `half degree longitude at equator ≈ 34.6 mi, got ${eq}`);
});

test("haversineMiles orders the fixture ZIPs from a 30005-origin correctly", () => {
  const origin = { latitude: 34.079, longitude: -84.229 };
  const near = haversineMiles(origin.latitude, origin.longitude, 33.998, -84.285); // 30022
  const far = haversineMiles(origin.latitude, origin.longitude, 30.262, -97.718); // 78702 Austin
  const farther = haversineMiles(origin.latitude, origin.longitude, 45.505, -122.679); // 97201 Portland
  assert.ok(near < far);
  assert.ok(far < farther);
});