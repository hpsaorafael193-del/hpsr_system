import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const page = readFileSync("src/app/dashboard/obstetra/page.tsx", "utf8");
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
assert.equal(pkg.version, "1.1.16-test.30");
assert(page.includes("xl:items-stretch"), "a coluna do resumo deve acompanhar a altura da definição médica");
assert(page.includes('flex h-full min-h-[360px] w-full max-w-[320px] justify-self-end flex-col bg-transparent'), "o resumo deve ocupar a coluna direita, ancorado à direita e sem borda externa");
assert(page.includes('mt-5 flex flex-1 flex-col justify-between border-t border-[#dfc4cd] pt-5'), "o resumo deve distribuir os marcos no corpo da coluna");
console.log("PASS v1.1.16-test.30: resumo ocupa a coluna direita, ancorado à direita, sem borda externa e com detalhes internos preservados.");
