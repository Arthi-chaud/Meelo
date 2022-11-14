import Action from "../contextual-menu/actions";
import SearchIcon from '@mui/icons-material/Search';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import API from "../../api";
import toast from "react-hot-toast";
import SettingsIcon from '@mui/icons-material/Settings';
import { createElement } from "react";

/**
 * Collections of actions that are accessible from appbar and drawer
 */
const AppBarActions: Action[] = [
	{
		label: 'Search',
		icon: createElement(SearchIcon),
		href: '/search',
	},
	{
		label: 'Refresh Libraries',
		icon: createElement(AutoModeIcon),
		onClick: () => API.scanLibraries().then(({ status }) => toast.success(status, { duration: 4000 })),
	},
	{
		label: 'Settings',
		icon: createElement(SettingsIcon),
		disabled: true,
		href: '/settings'
	}
];

export default AppBarActions;