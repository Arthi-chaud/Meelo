import Action from "../action";
import SearchIcon from '@mui/icons-material/Search';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import API from "../../api";
import toast from "react-hot-toast";
import SettingsIcon from '@mui/icons-material/Settings';
import { createElement } from "react";
import LogoutIcon from '@mui/icons-material/Logout';
import { useDispatch } from "react-redux";
import { deleteCookie } from "cookies-next";
import UserAccessTokenCookieKey from "../../utils/user-access-token-cookie-key";

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
	},
	{
		label: 'Logout',
		icon: createElement(LogoutIcon),
		onClick: () => deleteCookie(UserAccessTokenCookieKey)
	}
];

export default AppBarActions;