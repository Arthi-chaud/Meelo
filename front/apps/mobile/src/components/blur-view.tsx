import { BlurView as BV } from "expo-blur";
import { withUnistyles } from "react-native-unistyles";

export const BlurView = withUnistyles(
	BV,
	(theme) =>
		({
			tint: theme.name === "light" ? "light" : "dark",
			experimentalBlurMethod: "dimezisBlurView",
			intensity: 80,
		}) as const,
);
