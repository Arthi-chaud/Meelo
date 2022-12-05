import Action from "../actions/action";
import store from "../../state/store";
import { ScanAllLibrariesAction } from "../actions/library-task";
import { GoToSearchAction, GoToSettingsAction } from "../actions/link";
import { LogoutAction } from "../actions/auth";

/**
 * Collections of actions that are accessible from appbar and drawer
 */
const getAppBarActions: () => Action[] = () => [
	GoToSearchAction,
	{
		...ScanAllLibrariesAction,
		disabled: store.getState().user.user?.admin !== true
	},
	{
		...GoToSettingsAction,
		disabled: store.getState().user.user?.admin !== true
	},
	LogoutAction
];

export default getAppBarActions;
