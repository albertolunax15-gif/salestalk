import { Language } from "./VoiceRecognizer"

type LanguageSelectorProps = {
  lang: string
  languages: Language[]
  onLanguageChange: (lang: string) => void
}

export const LanguageSelector = ({ lang, languages, onLanguageChange }: LanguageSelectorProps) => {
  return (
    <select
      value={lang}
      onChange={(e) => onLanguageChange(e.target.value)}
      className="border rounded-md px-2 py-1 text-sm"
      title="Idioma de reconocimiento"
    >
      {languages.map((l) => (
        <option key={l.code} value={l.code}>{l.name}</option>
      ))}
    </select>
  )
}