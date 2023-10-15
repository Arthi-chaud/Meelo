import store, { RootState } from "../../state/store";
import Action from "./action";
import { TranslateIcon } from '../icons';
import { Language, Languages } from "../../i18n/i18n";
import { setLanguage } from "../../state/settingsSlice";
import { TranslationKey } from "../../i18n/translations/type";

const getLanguageDisplayName = (ln: Language) => {
	switch (ln) {
	case 'en':
		return 'English';
	case 'fr':
		return 'French';
	}
};

const ChangeLanguageAction = (selectedLanguage: RootState['settings']['language']): Action => {
	const baseAction = {
		icon: <TranslateIcon/>
	};
	let nextLanguageIndex = Languages.findIndex((ln) => ln == selectedLanguage) + 1;

	if (selectedLanguage == Languages.at(-1)) {
		nextLanguageIndex = 0;
	}

	return {
		...baseAction,
		label: `Switch to ${getLanguageDisplayName(Languages.at(nextLanguageIndex)!)}` as TranslationKey,
		onClick: () => store.dispatch(setLanguage(Languages.at(nextLanguageIndex)!))
	};
};

export default ChangeLanguageAction;
