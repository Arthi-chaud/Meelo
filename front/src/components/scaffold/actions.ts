import Action from "../actions/action";
import { RootState } from "../../state/store";
import { GoToSearchAction, GoToSettingsAction } from "../actions/link";
import { LogoutAction } from "../actions/auth";
import {
	SetDarkColorSchemeAction, SetLightColorSchemeAction, SetSystemColorSchemeAction
} from "../actions/color-scheme";
import ChangeLanguageAction from "../actions/language";
import { useMemo } from "react";
import { useSelector } from "react-redux";

/**
 * Collections of actions that are accessible from appbar and drawer
 */
const getScaffoldActions = (
	selectedColorScheme: RootState['settings']['colorScheme'],
	selectedLanguage: RootState['settings']['language'],
	isAdmin: boolean
): Action[] => [
	GoToSearchAction,
	selectedColorScheme == 'dark'
		? SetLightColorSchemeAction
		: selectedColorScheme == 'light'
			? SetSystemColorSchemeAction
			: SetDarkColorSchemeAction,
	ChangeLanguageAction(selectedLanguage),
	...(isAdmin ? [GoToSettingsAction] : []),
	LogoutAction
];

/**
 * A simple hook to get/build AppBar Actions using the redux store
 */
const useScaffoldActions = () => {
	const colorSchemeSetting = useSelector((state: RootState) => state.settings.colorScheme);
	const languageSetting = useSelector((state: RootState) => state.settings.language);
	const user = useSelector((state: RootState) => state.user.user);

	return useMemo(
		() => getScaffoldActions(colorSchemeSetting, languageSetting, user?.admin ?? false),
		[colorSchemeSetting, languageSetting, user]
	);
};

export { getScaffoldActions, useScaffoldActions };
