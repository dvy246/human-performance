export type LangCode = "en" | "es" | "fr" | "de" | "pt" | "ja"

export const languages: { code: LangCode; name: string; flag: string }[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
]

export const nonDefaultLocales: LangCode[] = ["es", "fr", "de", "pt", "ja"]

export function getLocalizedPath(pathname: string, lang: LangCode = "en"): string {
  const cleanPath = pathname.replace(/^\/(es|fr|de|pt|ja)(\/|$)/, "/")
  let normalized = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`
  if (!normalized.endsWith("/")) {
    normalized += "/"
  }
  if (lang === "en") {
    return normalized
  }
  return `/${lang}${normalized === "/" ? "/" : normalized}`
}
