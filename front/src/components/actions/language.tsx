import store, { RootState } from "../../state/store";
import Action from "./action";
import TranslateIcon from '@mui/icons-material/Translate';
import { Language, Languages } from "../../i18n/i18n";
import { resetLanguage, setLanguage } from "../../state/settingsSlice";

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
	const nextLanguageIndex = Languages.findIndex((ln) => ln == selectedLanguage) + 1;

	if (selectedLanguage == Languages.at(-1)) {
		return {
			...baseAction,
			label: 'Switch to default language',
			onClick: () => store.dispatch(resetLanguage())
		};
	}

	return {
		...baseAction,
		label: `Switch to ${getLanguageDisplayName(Languages.at(nextLanguageIndex)!)}`,
		onClick: () => store.dispatch(setLanguage(Languages.at(nextLanguageIndex)!))
	};
};

export default ChangeLanguageAction;
