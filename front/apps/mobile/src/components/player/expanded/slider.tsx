import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { View } from "react-native";
import { Slider as AwesomSlider } from "react-native-awesome-slider";
import { useSharedValue } from "react-native-reanimated";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { useAccentColor } from "~/hooks/accent-color";
import { currentTrackAtom } from "../state";

export const Slider = () => {
	const currentTrack = useAtomValue(currentTrackAtom);
	const progress = useSharedValue(0);
	const minValue = useSharedValue(0);
	const maxValue = useSharedValue(0);
	const accentColor = useAccentColor(currentTrack?.track.illustration);
	useEffect(() => {
		maxValue.value = currentTrack?.track.duration ?? 1;
		progress.value = (currentTrack?.track.duration ?? 0) / 2;
	}, [currentTrack]);
	return (
		<View style={styles.root}>
			<Slider_
				theme={{
					minimumTrackTintColor: accentColor,
					// Converting the accent color from rgb to rgba
					maximumTrackTintColor: `${accentColor}30`,
				}}
				minimumValue={minValue}
				progress={progress}
				maximumValue={maxValue}
			/>
		</View>
	);
};

const Slider_ = withUnistyles(AwesomSlider, (theme) => ({
	thumbWidth: 0,
	sliderHeight: theme.gap(1),
	renderThumb: () => null,
	renderBubble: () => null,
	containerStyle: {
		borderRadius: theme.borderRadius,
	},
}));

const styles = StyleSheet.create(() => ({
	root: { flexDirection: "row" },
}));
