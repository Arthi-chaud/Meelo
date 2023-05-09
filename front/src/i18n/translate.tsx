import { useSelector } from "react-redux";
import store, { RootState } from "../state/store";
import TranslationMap from "./translations/type";
import i18n, { Languages } from "./i18n";

const getSystemLanguage = () => {
	return Languages.find((ln) => new RegExp(`/${ln}\b/`).test(navigator.language)) ?? 'en';
};

// Translate text according to store
const translate = (key: keyof TranslationMap) => {
	const language = store.getState().settings.language;

	return i18n.t(key, {
		lng: language == 'system'
			? getSystemLanguage()
			: language
	});
};

type TranslateProps = {
	translationKey: keyof TranslationMap;
	format?: (s: string) => string;
}

/**
 * JSX component that returns the translation of the key
 */
const Translate = (props: TranslateProps) => {
	const selectedLanguage = useSelector((state: RootState) => {
		const currentLanguage = state.settings.language;

		if (currentLanguage == 'system') {
			return getSystemLanguage();
		}
		return currentLanguage;
	});
	const translated = i18n.t(props.translationKey, { lng: selectedLanguage });

	return <>{props.format ? props.format(translated) : translated}</>;
};

export default Translate;
export { translate };
