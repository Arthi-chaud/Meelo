import { useUnistyles } from "react-native-unistyles";
import type Illustration from "@/models/illustration";
import { useAccentColor as useAccentColor_ } from "@/utils/accent-color";

export const useAccentColor = (
	illustration: Illustration | null | undefined,
) => {
	const accentColor = useAccentColor_(illustration);
	const { theme } = useUnistyles();

	if (!accentColor) {
		return undefined;
	}
	return accentColor[theme.name];
};
