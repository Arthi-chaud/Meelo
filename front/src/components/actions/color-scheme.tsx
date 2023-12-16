import { DarkMode, LightMode } from "../icons";
import { setColorScheme } from "../../state/settingsSlice";
import store from "../../state/store";
import Action from "./action";

export const SetLightColorSchemeAction: Action = {
	label: "lightMode",
	icon: <LightMode />,
	onClick: () => store.dispatch(setColorScheme("light")),
};

export const SetDarkColorSchemeAction: Action = {
	label: "darkMode",
	icon: <DarkMode />,
	onClick: () => store.dispatch(setColorScheme("dark")),
};
