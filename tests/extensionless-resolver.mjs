// Minimal Node ESM resolve hook: allows extensionless relative imports used by
// the Next.js codebase (e.g. "../db/schema") to resolve as ".ts" under raw
// `node --test`. Registered by register-extensionless.mjs.
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (err?.code === "ERR_MODULE_NOT_FOUND" && (specifier.startsWith("./") || specifier.startsWith("../"))) {
      try {
        return await nextResolve(`${specifier}.ts`, context);
      } catch {
        throw err;
      }
    }
    throw err;
  }
}
