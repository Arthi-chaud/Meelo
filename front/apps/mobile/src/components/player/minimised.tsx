import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import { Pressable as RNPRessable, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { useAnimatedTheme } from "react-native-unistyles/reanimated";
import {
	cursorAtom,
	playlistAtom,
	skipTrackAtom,
	type TrackState,
} from "@/state/player";
import { ForwardIcon, PauseIcon } from "@/ui/icons";
import { useQueryClient } from "~/api";
import { Illustration } from "~/components/illustration";
import { LoadableText } from "~/components/loadable_text";
import { useAccentColor } from "~/hooks/accent-color";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";
import { expandPlayerAtom } from "./expanded/state";

// TODO Test text overflow
// TODO Get artist featuring
// TODO Pause state
// TODO Progress state
// TODO Move spring params to theme

export const MinimisedPlayer = () => {
	const queue = useAtomValue(playlistAtom);
	const expandPlayer = useSetAtom(expandPlayerAtom);
	const queryClient = useQueryClient();
	const cursor = useAtomValue(cursorAtom);
	const skipTrack = useSetAtom(skipTrackAtom);
	const currentTrack: TrackState | null = useMemo(() => {
		return queue[cursor] ?? null;
	}, [queue, cursor]);
	const isVideo = useMemo(() => {
		return currentTrack?.track.type === "Video";
	}, [currentTrack]);
	const onSkip = useCallback(() => {
		skipTrack(queryClient);
	}, [queryClient, skipTrack]);
	const progress = currentTrack ? 50 : 0; //TODO
	const animatedTheme = useAnimatedTheme();

	/// background color
	const firstIllustrationColor = useMemo(
		() => currentTrack?.track.illustration?.colors.at(0) ?? undefined,
		[currentTrack],
	);
	const backgroundColorSV = useSharedValue("transparent");
	useEffect(() => {
		backgroundColorSV.value = withSpring(
			firstIllustrationColor ?? "transparent",
			animatedTheme.value.animations.fades,
		);
	}, [firstIllustrationColor]);
	const backgroundStyle = useAnimatedStyle(
		() => ({ backgroundColor: backgroundColorSV.value }),
		[firstIllustrationColor],
	);

	// Progress bar (color and width)
	const accentColor = useAccentColor(currentTrack?.track.illustration);
	const progressWidth = useSharedValue<`${number}%`>(`0%`);
	useEffect(() => {
		progressWidth.value = withSpring(
			`${progress}%`,
			animatedTheme.value.animations.progress,
		);
	}, [progress, currentTrack]);
	const progressStyle = useAnimatedStyle(
		() => ({
			backgroundColor:
				accentColor ?? animatedTheme.value.colors.text.primary,
			width: progressWidth.value,
		}),
		[firstIllustrationColor, progress],
	);

	const onPress = useCallback(() => expandPlayer(), [expandPlayer]);

	return (
		<RNPRessable style={styles.root} onPress={onPress}>
			<Animated.View style={[styles.background, backgroundStyle]} />
			<View style={styles.content}>
				<View style={styles.illustration}>
					<Illustration
						illustration={currentTrack?.track.illustration}
						normalizedThumbnail={isVideo}
						variant="center"
						useBlurhash
						quality={isVideo ? "medium" : "low"}
					/>
				</View>
				<View style={styles.text}>
					<LoadableText
						content={currentTrack?.track.name}
						numberOfLines={1}
						variant="h6"
						skeletonWidth={15}
					/>
					<LoadableText
						content={currentTrack?.artist.name}
						numberOfLines={1}
						variant="body"
						skeletonWidth={15}
					/>
				</View>
				<View style={styles.controls}>
					<Pressable onPress={() => {}}>
						<Icon icon={PauseIcon} />
					</Pressable>

					<Pressable onPress={onSkip}>
						<Icon icon={ForwardIcon} />
					</Pressable>
				</View>
			</View>
			<Animated.View style={[styles.progessPosition, progressStyle]} />
		</RNPRessable>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: {
		width: "100%",
		borderRadius: theme.borderRadius,
		overflow: "hidden",
		backgroundColor: theme.colors.background,
	},
	content: {
		flexDirection: "row",
		paddingLeft: theme.gap(1), // For consistency
		gap: theme.gap(1),
		padding: theme.gap(0.75),
		paddingBottom: theme.gap(0.75 + 0.25),
	},
	background: {
		...StyleSheet.absoluteFillObject,
		width: "100%",
		height: "100%",

		opacity: 0.3,
	},
	text: { justifyContent: "space-evenly", flex: 1 },
	progessPosition: {
		backgroundColor: theme.colors.text.primary,
		height: theme.gap(1 / 3),
		position: "absolute",
		bottom: 0,
		overflow: "hidden",
		borderBottomEndRadius: theme.borderRadius,
		borderTopEndRadius: theme.borderRadius,
	},

	illustration: {
		height: theme.gap(5.5),
	},
	controls: {
		flexDirection: "row",
		gap: theme.gap(2),
		paddingHorizontal: theme.gap(1),
		alignItems: "center",
	},
}));
