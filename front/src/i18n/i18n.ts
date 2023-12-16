import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./translations/en";
import fr from "./translations/fr";

const Languages = ["en", "fr"] as const;
const Resources = { en, fr };

i18n.use(initReactI18next) // passes i18n down to react-i18next
	.init({
		resources: {
			en: { translation: en },
			fr: { translation: fr },
		},
		interpolation: {
			escapeValue: false,
		},
	});

export type Language = keyof typeof Resources;
export { Languages };
export default i18n;
