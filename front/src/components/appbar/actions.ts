import Action from "../actions/action";
import store, { RootState } from "../../state/store";
import { ScanAllLibrariesAction } from "../actions/library-task";
import { GoToSearchAction, GoToSettingsAction } from "../actions/link";
import { LogoutAction } from "../actions/auth";
import {
	SetDarkColorSchemeAction, SetLightColorSchemeAction, SetSystemColorSchemeAction
} from "../actions/color-scheme";

/**
 * Collections of actions that are accessible from appbar and drawer
 */
const getAppBarActions = (selectedColorScheme: RootState['settings']['colorScheme']): Action[] => [
	GoToSearchAction,
	{
		...ScanAllLibrariesAction,
		disabled: store.getState().user.user?.admin !== true
	},
	selectedColorScheme == 'dark'
		? SetLightColorSchemeAction
		: selectedColorScheme == 'light'
			? SetSystemColorSchemeAction
			: SetDarkColorSchemeAction,
	{
		...GoToSettingsAction,
		disabled: store.getState().user.user?.admin !== true
	},
	LogoutAction
];

export default getAppBarActions;
