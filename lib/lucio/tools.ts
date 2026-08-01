// Lucio's structured tools — thin wrappers over existing repositories/stores.
// No new data-access logic: every tool reads through the same functions the
// rest of the app already uses, so Lucio can never see or say more than a
// real page would. Reviews and Availability are deliberately absent: neither
// exists as real structured data in this app (contractors only have a
// reviewsUrl link-out; booking has no live calendar) — building tools for
// them would mean fabricating answers.
import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { contractorStore } from "@/lib/store";
import { publicContractor } from "@/lib/auth";
import { agentProfileStore } from "@/lib/agent-profiles/store";
import { publicAgentProfile } from "@/lib/agent-profiles/auth";
import { demoTenant } from "@/lib/real-estate/fixtures";
import { listPublishedPropertiesWithFallback } from "@/lib/real-estate/homes-fallback";
import { listProjects } from "@/lib/southline-diy";
import { PROFESSION_TYPES, professionTypeLabel } from "@/lib/profession-types";
import { searchFaq as searchFaqData, type FaqCategory } from "@/lib/faq";

const langSchema = z.enum(["en", "es"]);

// Some models (observed with Groq's Llama models) emit the literal JSON text
// "null" instead of "{}" when a tool call has no arguments to fill in —
// z.object({...}).parse(null) then throws, and the whole tool call fails.
// Wrapping any schema where every field is optional (or there are none)
// makes it accept null/undefined the same as an empty object.
function nullableArgs<T extends z.ZodRawShape>(shape: T) {
  return z.preprocess((value) => value ?? {}, z.object(shape));
}

export const searchHomesTool = tool({
  description: "Search published home listings by city or keyword. Use this whenever the visitor asks about homes, listings, or real estate.",
  inputSchema: nullableArgs({
    query: z.string().optional().describe("City, neighborhood, or keyword to search for"),
  }),
  execute: async ({ query }) => {
    const result = await listPublishedPropertiesWithFallback(demoTenant.id, { search: query, pageSize: 5 });
    return {
      properties: result.properties.map((p) => ({
        title: p.title,
        slug: p.slug,
        city: p.city,
        state: p.state,
        price: p.price,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        squareFeet: p.squareFeet,
        status: p.status,
        url: `/homes/${p.slug}`,
      })),
    };
  },
});

export const searchProfessionalsTool = tool({
  description: "Search local professionals (contractors, remodelers, electricians, etc.) and real-estate agents by profession type or service area. Use this whenever the visitor asks to find or hire a professional.",
  inputSchema: nullableArgs({
    professionType: z.string().optional().describe("One of the known profession type ids, e.g. 'electrician', 'landscaper'"),
    serviceArea: z.string().optional().describe("City or area keyword"),
  }),
  execute: async ({ professionType, serviceArea }) => {
    const allContractors = await contractorStore.list().catch(() => []);
    const filtered = allContractors.filter((c) => {
      if (professionType && c.professionType !== professionType) return false;
      if (serviceArea && !c.serviceArea?.toLowerCase().includes(serviceArea.toLowerCase())) return false;
      return true;
    });
    const contractors = filtered.slice(0, 5).map(publicContractor).map((c) => ({
      businessName: c.businessName,
      professionType: c.professionType,
      professionLabel: professionTypeLabel(c.professionType, "en"),
      serviceArea: c.serviceArea,
      tagline: c.tagline,
      url: `/contractor/${c.username}`,
    }));

    let agents: { name: string; brokerageName?: string; serviceArea?: string; url: string }[] = [];
    if (!professionType || professionType === "realtor") {
      const activeAgents = await agentProfileStore.listActive().catch(() => []);
      agents = activeAgents.slice(0, 5).map(publicAgentProfile).map((a) => ({
        name: a.name,
        brokerageName: a.brokerageName,
        serviceArea: a.serviceArea,
        url: `/agents/${a.slug}`,
      }));
    }

    return { contractors, agents };
  },
});

export const searchDiyProjectsTool = tool({
  description: "Search DIY project guides by keyword or category. Use this for DIY help or when comparing DIY vs hiring a professional.",
  inputSchema: nullableArgs({
    query: z.string().optional().describe("Keyword, e.g. 'paint', 'backsplash'"),
  }),
  execute: async ({ query }) => {
    const projects = await listProjects().catch(() => []);
    const q = query?.toLowerCase().trim();
    const filtered = q
      ? projects.filter((p) => p.titleEn.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
      : projects;
    return {
      projects: filtered.slice(0, 5).map((p) => ({
        title: p.titleEn,
        difficulty: p.difficulty,
        estimatedTime: p.timeEn,
        estimatedBudget: p.budgetEn,
        url: `/diy/${p.slug}`,
      })),
    };
  },
});

export const getServiceCategoriesTool = tool({
  description: "List the supported profession/service categories on Southline Living.",
  inputSchema: nullableArgs({}),
  execute: async () => ({
    categories: PROFESSION_TYPES.map((p) => ({ id: p.id, label: p.en })),
  }),
});

export const searchFaqTool = tool({
  description: "Search Southline Living's FAQ knowledge base. Use this for questions about how the platform, SnapLink, verification, privacy, or professional membership works.",
  inputSchema: z.object({
    query: z.string().describe("The visitor's question or keywords"),
    lang: langSchema.default("en"),
  }),
  execute: async ({ query, lang }) => {
    const hits = searchFaqData(query, lang, undefined, 3);
    return {
      results: hits.map((h) => ({
        question: lang === "es" ? h.questionEs : h.questionEn,
        answer: lang === "es" ? h.answerEs : h.answerEn,
        category: h.category as FaqCategory,
      })),
    };
  },
});

export const startProjectEstimateTool = tool({
  description: "Hand off to the real interactive project cost estimator. Never compute a cost estimate yourself — always use this tool and point the visitor at the real estimator.",
  inputSchema: nullableArgs({
    projectType: z.string().optional().describe("Project type keyword, if known, e.g. 'kitchen remodel'"),
  }),
  execute: async ({ projectType }) => ({
    url: projectType ? `/planner?projectType=${encodeURIComponent(projectType)}` : "/planner",
    note: "This links to Southline Living's real project estimator. Any number it produces is a planning-stage estimate, not a final quote.",
  }),
});

export const proposeLeadOrBookingTool = tool({
  description:
    "Prepare a lead or booking request for the visitor to review and confirm. This tool NEVER submits anything — it only returns a confirmation payload for the UI to show. The visitor must click Confirm in the app before anything is actually sent.",
  inputSchema: z.object({
    kind: z.enum(["lead", "booking"]),
    name: z.string(),
    phone: z.string(),
    projectType: z.string(),
    contractorUsername: z.string().optional().describe("If the visitor already picked a specific professional"),
  }),
  execute: async ({ kind, name, phone, projectType, contractorUsername }) => {
    let contractorBusinessName: string | undefined;
    if (contractorUsername) {
      const contractor = await contractorStore.getByUsername(contractorUsername).catch(() => null);
      contractorBusinessName = contractor?.businessName;
    }
    return {
      kind,
      requiresConfirmation: true,
      summary: { name, phone, projectType, contractorUsername, contractorBusinessName },
    };
  },
});

export const lucioTools = {
  searchHomes: searchHomesTool,
  searchProfessionals: searchProfessionalsTool,
  searchDiyProjects: searchDiyProjectsTool,
  getServiceCategories: getServiceCategoriesTool,
  searchFaq: searchFaqTool,
  startProjectEstimate: startProjectEstimateTool,
  proposeLeadOrBooking: proposeLeadOrBookingTool,
};
