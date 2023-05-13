import Logout from "@mui/icons-material/Logout";
import store from "../../state/store";
import { unsetAccessToken } from "../../state/userSlice";
import Action from "./action";

export const LogoutAction: Action = {
	label: 'logout',
	icon: <Logout/>,
	href: '/',
	onClick: () => store.dispatch(unsetAccessToken())
};
