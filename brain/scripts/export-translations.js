import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function run() {
  const { translations } = await import("../src/i18n/translations.ts")
  const outDir = path.resolve(__dirname, "../public/locales")
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }
  const outFile = path.join(outDir, "translations.json")
  fs.writeFileSync(outFile, JSON.stringify(translations), "utf-8")
  console.log(`[export-translations] Successfully exported translations to ${outFile}`)
}

run().catch((err) => {
  console.error("[export-translations] Error:", err)
  process.exit(1)
})
