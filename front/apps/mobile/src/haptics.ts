import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export const onContextMenuOpen = () => {
	if (Platform.OS === "android") {
		Haptics.performAndroidHapticsAsync(
			Haptics.AndroidHaptics.Context_Click,
		);
	}
};

export const onDragStart = () => {
	if (Platform.OS === "android") {
		Haptics.performAndroidHapticsAsync(
			Haptics.AndroidHaptics.Gesture_Start,
		);
	}
};
