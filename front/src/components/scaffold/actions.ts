import Action from "../actions/action";
import { GoToSearchAction, GoToSettingsAction } from "../actions/link";
import { LogoutAction } from "../actions/auth";

/**
 * Collections of actions that are accessible from appbar and drawer
 */
const scaffoldActions: Action[] = [
	GoToSearchAction,
	GoToSettingsAction,
	LogoutAction
];

export default scaffoldActions;
