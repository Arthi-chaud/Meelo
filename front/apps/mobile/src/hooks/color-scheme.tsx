import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { useColorScheme as useRNColorScheme } from "react-native";
import { colorSchemePreference } from "~/state/color-scheme";

export const useColorScheme = () => {
	const colorSchemePref = useAtomValue(colorSchemePreference);
	const rnColorScheme = useRNColorScheme();
	const actualColorScheme = useMemo(() => {
		if (colorSchemePref === "system") {
			if (rnColorScheme === "unspecified") return "light";
			return rnColorScheme;
		}
		return colorSchemePref;
	}, [rnColorScheme, colorSchemePref]);
	return actualColorScheme;
};
