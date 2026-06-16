import en from "../../locales/en.json";
import id from "../../locales/id.json";

export type Locale = "en" | "id";

export type TranslationKeys = keyof typeof en;

export const translations = {
  en,
  id
};
