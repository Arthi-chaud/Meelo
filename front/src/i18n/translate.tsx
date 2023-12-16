import { useSelector } from "react-redux";
import store, { RootState } from "../state/store";
import { TranslationKey } from "./translations/type";
import i18n, { Languages } from "./i18n";
import { isSSR } from "../ssr";

// Hook to Get current language
const useLanguage = () => {
	return useSelector((state: RootState) => {
		const currentLanguage = state.settings.language;

		if (currentLanguage == "system") {
			return getSystemLanguage();
		}
		return currentLanguage;
	});
};

const getSystemLanguage = () => {
	if (isSSR()) {
		// This should never happen, as we parse and dispatch the language based on the request's "accept-language"
		return "en";
	}
	return (
		Languages.find((ln) =>
			new RegExp(`/${ln}\b/`).test(navigator.language),
		) ?? "en"
	);
};

// Translate text according to store
const translate = (key: TranslationKey) => {
	const language = store.getState().settings.language;

	return i18n.t(key, {
		lng: language == "system" ? getSystemLanguage() : language,
	});
};

type TranslateProps = {
	translationKey: TranslationKey;
	format?: (s: string) => string;
};

/**
 * JSX component that returns the translation of the key
 */
const Translate = (props: TranslateProps) => {
	const selectedLanguage = useLanguage();
	const translated = i18n.t(props.translationKey, { lng: selectedLanguage });

	return <>{props.format ? props.format(translated) : translated}</>;
};

export default Translate;
export { translate, useLanguage };
