import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { currentTrackAtom } from "../state";
import { ColorBackgroundOpacity } from "../utils";

export const ExpandedPlayer = () => {
	return (
		<View style={{ flex: 1 }}>
			<ColorBackground />
		</View>
	);
};

const ColorBackground = () => {
	const currentTrack = useAtomValue(currentTrackAtom);
	const mainIllustrationColor = useMemo(
		() => currentTrack?.track.illustration?.colors.at(0) ?? undefined,
		[currentTrack],
	);
	return (
		<View
			style={[
				styles.colorBackground,
				{ backgroundColor: mainIllustrationColor },
			]}
		/>
	);
};

const styles = StyleSheet.create((theme) => ({
	colorBackground: {
		opacity: ColorBackgroundOpacity,
		position: "relative",
		backgroundColor: theme.colors.background,
		top: 0,
		flex: 1,
	},
}));
