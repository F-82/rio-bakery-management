import { getCurrentProfile } from "@/lib/queries/profile";
import translationEN from "../../public/locales/en/translation.json";
import translationSI from "../../public/locales/si/translation.json";

const resources: Record<string, Record<string, string>> = {
  en: translationEN,
  si: translationSI,
};

export async function getTranslation() {
  const profile = await getCurrentProfile();
  const lang = profile?.language_pref || "en";
  const dict = resources[lang] || resources["en"];
  
  return {
    t: (key: string) => dict[key] || key
  };
}
