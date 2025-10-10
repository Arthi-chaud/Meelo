import { LinearGradient } from "expo-linear-gradient";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { View, type ViewStyle } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import formatDuration from "@/utils/format-duration";
import { Illustration } from "~/components/illustration";
import { LoadableText } from "~/components/loadable_text";
import { Slider as Slider_ } from "~/components/player/slider";
import {
	currentTrackAtom,
	durationAtom,
	progressAtom,
} from "~/components/player/state";
import { useFormattedArtistName } from "~/components/player/utils";
import { Text } from "~/primitives/text";
import { useVideoIllustration } from "./utils";

type Props = { style: ViewStyle };

export const Bottom = ({ style }: Props) => {
	const illustration = useVideoIllustration();
	return (
		<LinearGradient
			style={[styles.root, style]}
			colors={["transparent", "black"]}
		>
			{illustration !== null && (
				<View style={styles.illustration}>
					<Illustration
						// NOTE : whe  illustration is 'wide', it fucks ups how it is layed out
						// No idea why and don't know why this fixes it
						style={{
							width: "0%",
							aspectRatio: illustration?.aspectRatio ?? 1,
						}}
						illustration={illustration}
						quality="medium"
					/>
				</View>
			)}
			<View style={styles.sliderColumn}>
				<VideoName />
				<Slider />
				<ProgressAndDuration />
			</View>
		</LinearGradient>
	);
};

const VideoName = () => {
	const track = useAtomValue(currentTrackAtom);
	const formattedArtistName = useFormattedArtistName();
	return (
		<View>
			<LoadableText
				content={track?.track.name}
				style={styles.text}
				variant="h4"
				skeletonWidth={10}
				numberOfLines={1}
			/>
			<LoadableText
				content={formattedArtistName}
				style={styles.text}
				variant="h5"
				skeletonWidth={10}
				numberOfLines={1}
			/>
		</View>
	);
};

const Slider = () => {
	const { theme } = useUnistyles();
	return (
		<Slider_
			sliderColor={theme.colors.text.primary}
			trackColor={theme.colors.divider}
		/>
	);
};

const ProgressAndDuration = () => {
	const progress = useAtomValue(progressAtom);
	const duration = useAtomValue(durationAtom);
	const formattedProgress = useMemo(
		() => formatDuration(progress),
		[progress],
	);
	const formattedDuration = useMemo(
		() => formatDuration(duration),
		[duration],
	);
	return (
		<View style={styles.progressRow}>
			<Text content={formattedProgress} style={styles.text} />
			<Text content={formattedDuration} style={styles.text} />
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: {
		width: "100%",
		flexDirection: "row",
		alignItems: "flex-end",
		gap: theme.gap(1.5),
	},
	illustration: {},
	sliderColumn: { flex: 1, gap: theme.gap(1) },
	text: { color: theme.colors.text.primary },
	progressRow: {
		width: "100%",
		flexDirection: "row",
		justifyContent: "space-between",
	},
}));
