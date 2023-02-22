import {
	BrightnessAuto, DarkMode, LightMode
} from "@mui/icons-material";
import { setColorScheme } from "../../state/settingsSlice";
import store from "../../state/store";
import Action from './action';

export const SetLightColorSchemeAction: Action = {
	label: 'Light Mode',
	icon: <LightMode/>,
	onClick: () => store.dispatch(setColorScheme('light'))
};

export const SetDarkColorSchemeAction: Action = {
	label: 'Dark Mode',
	icon: <DarkMode/>,
	onClick: () => store.dispatch(setColorScheme('dark'))
};

export const SetSystemColorSchemeAction: Action = {
	label: 'Auto Mode',
	icon: <BrightnessAuto/>,
	onClick: () => store.dispatch(setColorScheme('system'))
};
