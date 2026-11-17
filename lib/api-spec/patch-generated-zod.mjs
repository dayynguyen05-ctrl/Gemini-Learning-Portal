import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const outputPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../api-zod/src/generated/api.ts",
);
const generated = await readFile(outputPath, "utf8");
const patched = generated.replace(
  "import * as zod from 'zod';",
  "import * as zod from 'zod/v4';",
);

if (patched === generated && !generated.includes("from 'zod/v4'")) {
  throw new Error("Could not locate the generated Zod import to patch.");
}

await writeFile(outputPath, patched);
