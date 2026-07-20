import type { Contractor } from "./types";

// Demo seed profiles — inserted into .data/contractors.json on first access.
// New contractors are created via /contractor-admin/new-contractor.
export const CONTRACTOR_SEEDS: Contractor[] = [
  {
    id: "ctr_demo",
    username: "demo",
    pin: "111111",
    preferredLanguage: "es",
    businessName: "Alpharetta Pro Remodeling",
    ownerName: "Miguel Torres",
    phone: "+16785550142",
    whatsapp: "+16785550142",
    email: "estimates@alpharettapro.com",
    serviceArea: "Alpharetta · Roswell · Cumming · Johns Creek",
    services: [
      "Kitchen Remodel",
      "Bathroom Remodel",
      "Flooring",
      "Interior Painting",
      "Countertops",
      "Tile Work",
      "Drywall Install / Repair",
      "Handyman Repair",
    ],
    tagline: "Licensed & insured. Free estimates. Hablamos español.",
    licenseInfo: "GA Lic. #RBQA-004512 · Fully insured",
    reviewsUrl: "https://g.page/example-reviews",
    galleryUrl: "#gallery",
    createdAt: new Date("2026-01-01").toISOString(),
  },
  {
    id: "ctr_trees",
    username: "northsidetree",
    pin: "222222",
    preferredLanguage: "en",
    businessName: "Northside Tree Service",
    ownerName: "Dan Whitfield",
    phone: "+14045550177",
    whatsapp: "+14045550177",
    email: "dan@northsidetree.com",
    serviceArea: "North Metro Atlanta",
    services: ["Tree Service", "Landscaping", "Sod & Turf", "Pressure Washing"],
    tagline: "24/7 storm response. Crane + bucket truck on staff.",
    licenseInfo: "ISA Certified Arborist · Fully insured",
    createdAt: new Date("2026-01-01").toISOString(),
  },
];
