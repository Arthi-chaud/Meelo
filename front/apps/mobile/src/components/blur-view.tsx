import { BlurView as BV } from "expo-blur";
import { createRef } from "react";
import type { ViewInstance } from "react-native";
import { withUnistyles } from "react-native-unistyles";

export const bvTarget = createRef<ViewInstance | null>();

export const BlurView = withUnistyles(
	BV,
	(theme) =>
		({
			tint:
				theme.name === "light"
					? "systemThinMaterialLight"
					: "systemThinMaterialDark",
			blurMethod: "dimezisBlurViewSdk31Plus",
			intensity: 80,
		}) as const,
);
