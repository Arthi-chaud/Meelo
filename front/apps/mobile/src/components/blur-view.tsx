import { BlurView as BV } from "expo-blur";
import { createRef } from "react";
import type { View } from "react-native";
import { withUnistyles } from "react-native-unistyles";

export const bvTarget = createRef<View | null>();

export const BlurView = withUnistyles(
	BV,
	(theme) =>
		({
			tint: theme.name === "light" ? "light" : "dark",
			blurMethod: "dimezisBlurViewSdk31Plus",
			intensity: 80,
		}) as const,
);
