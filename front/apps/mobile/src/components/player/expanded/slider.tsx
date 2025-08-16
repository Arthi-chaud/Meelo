import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { View } from "react-native";
import { Slider as AwesomeSlider } from "react-native-awesome-slider";
import { useSharedValue, withSpring } from "react-native-reanimated";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { useAnimatedTheme } from "react-native-unistyles/reanimated";
import { useAccentColor } from "~/hooks/accent-color";
import {
	currentTrackAtom,
	durationAtom,
	progressAtom,
	requestedProgressAtom,
} from "../state";

export const Slider = () => {
	const currentTrack = useAtomValue(currentTrackAtom);
	const progress = useAtomValue(progressAtom);
	const setProgress = useSetAtom(requestedProgressAtom);
	const duration = useAtomValue(durationAtom);
	const progressShared = useSharedValue(progress);
	const minValueShared = useSharedValue(0);
	const maxValueShared = useSharedValue(duration ?? 1);
	const accentColor = useAccentColor(currentTrack?.track.illustration);
	const animatedTheme = useAnimatedTheme();
	useEffect(() => {
		maxValueShared.value = duration ?? 1;
		progressShared.value = withSpring(
			progress,
			animatedTheme.value.animations.progress,
		);
	}, [progress, duration]);
	return (
		<View style={styles.root}>
			<Slider_
				theme={{
					minimumTrackTintColor: accentColor,
					// Converting the accent color from rgb to rgba
					maximumTrackTintColor: `${accentColor}30`,
				}}
				onSlidingComplete={(newProgress) => {
					setProgress(newProgress);
				}}
				minimumValue={minValueShared}
				progress={progressShared}
				maximumValue={maxValueShared}
			/>
		</View>
	);
};

const Slider_ = withUnistyles(AwesomeSlider, (theme) => ({
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
