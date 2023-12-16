import { LogoutIcon } from "../icons";
import store from "../../state/store";
import { unsetAccessToken } from "../../state/userSlice";
import Action from "./action";

export const LogoutAction: Action = {
	label: "logout",
	icon: <LogoutIcon />,
	href: "/",
	onClick: () => store.dispatch(unsetAccessToken()),
};
