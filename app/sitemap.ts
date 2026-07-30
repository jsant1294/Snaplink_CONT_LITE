import { MetadataRoute } from "next";
import { listProjects } from "@/lib/southline-diy";
import { contractorStore } from "@/lib/store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://southlineliving.com";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/book`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/planner`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/diy`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/for-contractors`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/how-it-works`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/homes`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
  ];

  const categorySlugs = [
    "cocinas", "banos", "patios", "vida-al-aire-libre",
    "jardineria", "oficinas", "garajes", "almacenamiento",
    "ampliaciones", "reparaciones", "diy",
  ];
  const categoryRoutes = categorySlugs.map((slug) => ({
    url: `${baseUrl}/ideas/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const [projects, contractors] = await Promise.all([
    listProjects().catch(() => []),
    contractorStore.list().catch(() => []),
  ]);
  const diyRoutes = projects.map((p) => ({
    url: `${baseUrl}/diy/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  const contractorRoutes = contractors.map((c) => ({
    url: `${baseUrl}/contractor/${c.username}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...diyRoutes, ...contractorRoutes];
}
