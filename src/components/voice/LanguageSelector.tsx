import { Select } from "@/components/ui/select"
import { Language } from "./VoiceRecognizer"

type LanguageSelectorProps = {
  lang: string
  languages: Language[]
  onLanguageChange: (lang: string) => void
}

export const LanguageSelector = ({ lang, languages, onLanguageChange }: LanguageSelectorProps) => {
  return (
    <Select
      value={lang}
      onChange={(e) => onLanguageChange(e.target.value)}
      aria-label="Idioma de reconocimiento"
      className="h-8 text-xs"
    >
      {languages.map((l) => (
        <option key={l.code} value={l.code}>{l.name}</option>
      ))}
    </Select>
  )
}
