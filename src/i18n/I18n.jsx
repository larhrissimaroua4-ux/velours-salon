import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import en from './en'
import fr from './fr'

const DICTIONARIES = { fr, en }
const I18nContext = createContext(null)

function initialLocale() {
  try {
    const saved = localStorage.getItem('velours-locale')
    if (saved in DICTIONARIES) return saved
  } catch {
    /* stockage indisponible */
  }
  return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

export function I18nProvider({ children }) {
  const [locale, setLocale] = useState(initialLocale)

  useEffect(() => {
    document.documentElement.lang = locale
    try {
      localStorage.setItem('velours-locale', locale)
    } catch {
      /* stockage indisponible */
    }
  }, [locale])

  const t = useCallback((key) => key.split('.').reduce((node, part) => node?.[part], DICTIONARIES[locale]), [locale])
  const localize = useCallback((value) => (value && typeof value === 'object' ? (value[locale] ?? value.fr) : value), [locale])
  const toggle = useCallback(() => setLocale((current) => (current === 'fr' ? 'en' : 'fr')), [])

  const value = useMemo(() => ({ locale, t, localize, toggle }), [locale, t, localize, toggle])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useI18n = () => useContext(I18nContext)
