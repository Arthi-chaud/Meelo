import { useSelector } from "react-redux";
import { RootState } from "../state/store";
import TranslationMap from "./translations/type";
import i18n, { Languages } from "./i18n";

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
			return Languages.find((ln) => new RegExp(`/${ln}\b/`).test(navigator.language)) ?? 'en';
		}
		return currentLanguage;
	});
	const translated = i18n.t(props.translationKey, { lng: selectedLanguage });

	return <>{props.format ? props.format(translated) : translated}</>;
};

export default Translate;
