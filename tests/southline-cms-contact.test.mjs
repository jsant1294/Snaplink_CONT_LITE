import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { DEFAULT_CONTACT, defaultSouthlineSettings } from "../lib/southline-types.ts";
import { validateSouthlineSettings } from "../lib/southline-validation.ts";

const source = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("DEFAULT_CONTACT is backward-compatible: enabled with all-null fields and an empty hours list", () => {
  assert.equal(DEFAULT_CONTACT.enabled, true);
  assert.deepEqual(DEFAULT_CONTACT.hours, []);
  for (const field of [
    "heading",
    "body",
    "businessName",
    "businessDescription",
    "phone",
    "email",
    "whatsapp",
    "addressLine1",
    "addressLine2",
    "city",
    "region",
    "postalCode",
    "directionsUrl",
    "primaryCtaLabel",
    "primaryCtaType",
    "primaryCtaValue",
  ]) {
    assert.equal(DEFAULT_CONTACT[field], null, `${field} should default to null`);
  }
});

test("defaultSouthlineSettings includes a contact object that deep-equals the default", () => {
  const settings = defaultSouthlineSettings();
  assert.deepEqual(settings.contact, DEFAULT_CONTACT);
});

test("validateSouthlineSettings accepts a well-formed contact patch", () => {
  const patch = {
    contact: {
      enabled: true,
      heading: "Contact us",
      body: "Reach out anytime.",
      businessName: "Southline Living",
      businessDescription: "Trusted home professionals.",
      phone: "+1 (555) 000-0000",
      email: "hello@example.com",
      whatsapp: "+1 (555) 000-0000",
      addressLine1: "100 Main St",
      city: "Milton",
      region: "GA",
      postalCode: "30009",
      directionsUrl: "https://maps.google.com/?q=Milton",
      primaryCtaLabel: "Call us",
      primaryCtaType: "call",
      primaryCtaValue: "+1 (555) 000-0000",
      hours: [
        { id: "h1", dayLabel: "Monday – Friday", hoursLabel: "8 AM – 6 PM", enabled: true, sortOrder: 0 },
      ],
    },
  };
  assert.equal(validateSouthlineSettings(patch), null);
});

test("validateSouthlineSettings rejects malformed contact patches", () => {
  assert.match(
    validateSouthlineSettings({ contact: { enabled: "yes", hours: [] } }),
    /contact\.enabled must be a boolean/
  );
  assert.match(
    validateSouthlineSettings({ contact: { heading: 5, hours: [] } }),
    /contact\.heading must be a string or null/
  );
  assert.match(
    validateSouthlineSettings({ contact: { primaryCtaType: "fax", hours: [] } }),
    /contact\.primaryCtaType must be one of/
  );
  assert.match(
    validateSouthlineSettings({ contact: { hours: "nope" } }),
    /contact\.hours must be an array/
  );
  assert.match(
    validateSouthlineSettings({ contact: { hours: [{ id: "", dayLabel: "Mon", hoursLabel: "9-5", enabled: true, sortOrder: 0 }] } }),
    /contact\.hours\[0\]\.id must be a non-empty string/
  );
  assert.match(
    validateSouthlineSettings({ contact: { hours: [{ id: "h1", dayLabel: "Mon", hoursLabel: "9-5", enabled: 1, sortOrder: 0 }] } }),
    /contact\.hours\[0\]\.enabled must be a boolean/
  );
  assert.match(
    validateSouthlineSettings({ contact: { hours: [{ id: "h1", dayLabel: "Mon", hoursLabel: "9-5", enabled: true, sortOrder: "0" }] } }),
    /contact\.hours\[0\]\.sortOrder must be a number/
  );
  assert.match(validateSouthlineSettings({ contact: "nope" }), /contact must be an object/);
});

test("the JSON store merges stored contact hours onto the defaults on read", async () => {
  const store = await source("../lib/southline-store-json.ts");
  assert.match(store, /contact: \{ \.\.\.defaults\.contact, \.\.\.stored\.contact, hours: stored\.contact\?\.hours \?\? defaults\.contact\.hours \}/);
});

test("Footer.tsx accepts a contact prop and wires the Contact link to /contact (no dead placeholder)", async () => {
  const footer = await source("../components/southline/Footer.tsx");
  assert.match(footer, /contact\?: SouthlineContactContent/);
  assert.match(footer, /<Link href="\/contact"[\s\S]*?t\("footerContact", lang\)/);
  assert.doesNotMatch(footer, /href="#"[\s\S]{0,120}footerContact/);
});

test("the /contact page consumes CMS contact settings with i18n fallbacks and no dead links or emoji", async () => {
  const page = await source("../app/contact/page.tsx");
  assert.match(page, /southlineStore/);
  assert.match(page, /contact\?\.enabled === false/);
  assert.match(page, /notFound\(\)/);
  assert.match(page, /contact\?\.businessName/);
  assert.match(page, /contact\?\.primaryCtaType/);
  assert.match(page, /t\("contactHeading", lang\)/);
  assert.doesNotMatch(page, /href="#"/);
  assert.doesNotMatch(page, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
});

test("the admin shell exposes a Contact tab wired to ContactEditor", async () => {
  const admin = await source("../app/southline/admin/page.tsx");
  assert.match(admin, /ContactEditor/);
  assert.match(admin, /\{ key: "contact", label: "Contact" \}/);
  assert.match(admin, /tab === "contact" && <ContactEditor pin=\{pin\} \/>/);
});
