export const fmt = (s, vars = {}) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k]);

// English is the base; a missing language file or key falls back to it
export const strings = async (lang, load) => ({ ...(await load("locales/en.json")), ...(await load(`locales/${lang}.json`).catch(() => ({}))) });
