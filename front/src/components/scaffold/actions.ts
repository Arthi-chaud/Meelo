import Action from "../actions/action";
import { RootState } from "../../state/store";
import { GoToSearchAction, GoToSettingsAction } from "../actions/link";
import { LogoutAction } from "../actions/auth";
import { SetDarkColorSchemeAction, SetLightColorSchemeAction } from "../actions/color-scheme";
import ChangeLanguageAction from "../actions/language";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import useColorScheme from "../../theme/color-scheme";

/**
 * Collections of actions that are accessible from appbar and drawer
 */
const getScaffoldActions = (
	selectedColorScheme: Omit<RootState['settings']['colorScheme'], 'system'>,
	selectedLanguage: RootState['settings']['language'],
	isAdmin: boolean
): Action[] => [
	GoToSearchAction,
	selectedColorScheme == 'dark'
		? SetLightColorSchemeAction
		: SetDarkColorSchemeAction,
	ChangeLanguageAction(selectedLanguage),
	...(isAdmin ? [GoToSettingsAction] : []),
	LogoutAction
];

/**
 * A simple hook to get/build AppBar Actions using the redux store
 */
const useScaffoldActions = () => {
	const colorScheme = useColorScheme();
	const languageSetting = useSelector((state: RootState) => state.settings.language);
	const user = useSelector((state: RootState) => state.user.user);

	return useMemo(
		() => getScaffoldActions(colorScheme, languageSetting, user?.admin ?? false),
		[colorScheme, languageSetting, user]
	);
};

export { getScaffoldActions, useScaffoldActions };
