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
import { skipTrackAtom } from "@/state/player";
import { ForwardIcon, PauseIcon, PlayIcon } from "@/ui/icons";
import { useQuery, useQueryClient } from "~/api";
import { useContextMenu } from "~/components/context-menu";
import { useTrackContextMenu } from "~/components/context-menu/resource/track";
import { Illustration } from "~/components/illustration";
import { LoadableText } from "~/components/loadable_text";
import { useAccentColor } from "~/hooks/accent-color";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";
import { expandPlayerAtom } from "./expanded/state";
import { getTrackForContextMenu } from "./queries";
import {
	currentTrackAtom,
	durationAtom,
	isPlayingAtom,
	pauseAtom,
	playAtom,
	progressAtom,
} from "./state";
import { ColorBackground, useFormattedArtistName } from "./utils";

export const MinimisedPlayer = () => {
	const expandPlayer = useSetAtom(expandPlayerAtom);
	const queryClient = useQueryClient();
	const skipTrack = useSetAtom(skipTrackAtom);
	const currentTrack = useAtomValue(currentTrackAtom);
	const isVideo = useMemo(() => {
		return currentTrack?.track.type === "Video";
	}, [currentTrack]);
	const onSkip = useCallback(() => {
		skipTrack(queryClient);
	}, [queryClient, skipTrack]);
	const formattedArtistName = useFormattedArtistName();

	const { data: track } = useQuery(
		getTrackForContextMenu,
		currentTrack?.track.id,
	);

	const trackContextMenu = useTrackContextMenu(track);
	const { openContextMenu } = useContextMenu(trackContextMenu);

	const onPress = useCallback(() => expandPlayer(), [expandPlayer]);

	return (
		<RNPRessable
			style={styles.root}
			onPress={onPress}
			onLongPress={openContextMenu}
		>
			<ColorBackground />
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
						content={formattedArtistName}
						numberOfLines={1}
						variant="body"
						skeletonWidth={15}
					/>
				</View>
				<View style={styles.controls}>
					<PlayButton />
					<Pressable onPress={onSkip}>
						<Icon icon={ForwardIcon} style={styles.controlButton} />
					</Pressable>
				</View>
			</View>
			<ProgressBar />
		</RNPRessable>
	);
};

const ProgressBar = () => {
	const currentTrack = useAtomValue(currentTrackAtom);
	const firstIllustrationColor = useMemo(
		() => currentTrack?.track.illustration?.colors.at(0) ?? undefined,
		[currentTrack],
	);
	const progress = useAtomValue(progressAtom);
	const duration = useAtomValue(durationAtom);
	const animatedTheme = useAnimatedTheme();
	// Progress bar (color and width)
	const accentColor = useAccentColor(currentTrack?.track.illustration);
	const progressWidth = useSharedValue<`${number}%`>(`0%`);
	useEffect(() => {
		progressWidth.value = withSpring(
			currentTrack
				? `${Math.min((progress * 100) / (duration ?? 1), 100)}%`
				: `0%`,
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

	return <Animated.View style={[styles.progessPosition, progressStyle]} />;
};

const PlayButton = () => {
	const isPlaying = useAtomValue(isPlayingAtom);
	const play = useSetAtom(playAtom);
	const pause = useSetAtom(pauseAtom);
	return (
		<Pressable onPress={() => (isPlaying ? pause() : play())}>
			<Icon
				icon={isPlaying ? PauseIcon : PlayIcon}
				style={styles.controlButton}
			/>
		</Pressable>
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
		gap: theme.gap(1),
		padding: theme.gap(0.75),
		paddingBottom: theme.gap(0.75 + 1 / 3),
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
	controlButton: {
		size: theme.fontSize.rem(1.5),
	} as {},
	controls: {
		flexDirection: "row",
		gap: theme.gap(2),
		paddingHorizontal: theme.gap(1),
		alignItems: "center",
	},
}));
