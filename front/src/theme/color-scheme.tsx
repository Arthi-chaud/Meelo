import { useMediaQuery } from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "../state/store";

/**
 * Hook to get the current color shceme (light or dark)
 * Needs the store
 */
const useColorScheme = () => {
	const colorSetting = useSelector(
		(state: RootState) => state.settings.colorScheme,
	);
	const systemPrefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

	if (colorSetting == "system") {
		if (systemPrefersDarkMode) {
			return "dark";
		}
		return "light";
	}
	return colorSetting;
};

export default useColorScheme;
