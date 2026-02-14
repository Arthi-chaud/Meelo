import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import { Pressable as RNPRessable, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { useAnimatedTheme } from "react-native-unistyles/reanimated";
import { VideoView } from "react-native-video";
import { playlistLoadingAtom, skipTrackAtom } from "@/state/player";
import { ForwardIcon, PauseIcon, PlayIcon, RewindIcon } from "@/ui/icons";
import { useQuery, useQueryClient } from "~/api";
import { useContextMenu } from "~/components/context-menu";
import { useTrackContextMenu } from "~/components/context-menu/resource/track";
import { Illustration } from "~/components/illustration";
import { LoadableText } from "~/components/loadable_text";
import * as Haptics from "~/haptics";
import { useAccentColor } from "~/hooks/accent-color";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";
import { animations } from "~/theme";
import { videoPlayerAtom } from "./context";
import { expandPlayerAtom } from "./expanded/state";
import { getTrackForContextMenu } from "./queries";
import {
	currentTrackAtom,
	durationAtom,
	isPlayingAtom,
	pauseAtom,
	playAtom,
	progressAtom,
	rewindTrackAtom,
} from "./state";
import { ColorBackground, useFormattedArtistName } from "./utils";
export const MinimisedPlayer = () => {
	const expandPlayer = useSetAtom(expandPlayerAtom);
	const queryClient = useQueryClient();
	const skipTrack = useSetAtom(skipTrackAtom);
	const rewindTrack = useSetAtom(rewindTrackAtom);
	const currentTrack = useAtomValue(currentTrackAtom);
	const isVideo = useMemo(() => {
		return currentTrack?.track.type === "Video";
	}, [currentTrack]);
	const onSkip = useCallback(() => {
		skipTrack(queryClient);
	}, [queryClient, skipTrack]);
	const isLoading = useAtomValue(playlistLoadingAtom);
	const formattedArtistName = useFormattedArtistName();

	const player = useAtomValue(videoPlayerAtom);
	const { data: track } = useQuery(
		getTrackForContextMenu,
		currentTrack?.track.id,
	);

	const scale = useSharedValue<number>(1);
	const handlePress = useCallback(() => {
		scale.value = animations.pressable.scaleOnPress;
	}, []);
	const onPressOut = useCallback(() => {
		scale.value = 1;
	}, []);
	const pressStyle = useAnimatedStyle(() => ({
		transform: [
			{
				scale: withTiming(scale.value, animations.pressable.config),
			},
		],
	}));

	const trackContextMenu = useTrackContextMenu(track);
	const { openContextMenu } = useContextMenu(trackContextMenu);
	const onPress = useCallback(() => {
		handlePress();
		expandPlayer();
	}, [expandPlayer, handlePress]);
	const onLongPress = useCallback(() => {
		handlePress();
		openContextMenu();
		Haptics.onContextMenuOpen();
	}, [openContextMenu, handlePress]);
	styles.useVariants({ loading: isLoading });
	return (
		<RNPRessable
			android_disableSound
			onPress={onPress}
			onPressOut={onPressOut}
			onLongPress={onLongPress}
		>
			<Animated.View style={[styles.root, pressStyle]}>
				<ColorBackground />
				<View style={styles.content}>
					<View style={styles.illustration}>
						{currentTrack?.track.type === "Video" && player ? (
							<View style={styles.videoContainer}>
								<VideoView
									player={player}
									resizeMode="cover"
									style={styles.video}
								/>
							</View>
						) : (
							<Illustration
								illustration={currentTrack?.track.illustration}
								normalizedThumbnail={isVideo}
								variant="center"
								useBlurhash
								quality={isVideo ? "medium" : "low"}
							/>
						)}
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
						<Pressable
							onPress={rewindTrack}
							style={styles.rewindButton}
						>
							<Icon
								icon={RewindIcon}
								style={styles.controlButton}
							/>
						</Pressable>
						<PlayButton />
						<Pressable onPress={onSkip}>
							<Icon
								icon={ForwardIcon}
								style={styles.controlButton}
							/>
						</Pressable>
					</View>
				</View>
				<ProgressBar />
			</Animated.View>
		</RNPRessable>
	);
};

const ProgressBar = () => {
	const animatedTheme = useAnimatedTheme();
	const currentTrack = useAtomValue(currentTrackAtom);
	const firstIllustrationColor = useMemo(
		() => currentTrack?.track.illustration?.colors.at(0) ?? undefined,
		[currentTrack],
	);
	const progress = useAtomValue(progressAtom);
	const duration = useAtomValue(durationAtom);
	// Progress bar (color and width)
	const accentColor = useAccentColor(currentTrack?.track.illustration);
	const progressWidth = useSharedValue<`${number}%`>(`0%`);
	useEffect(() => {
		progressWidth.value = withTiming(
			currentTrack
				? `${Math.min((progress * 100) / (duration ?? 1), 100)}%`
				: `0%`,
			animations.progress,
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
	const isLoading = useAtomValue(playlistLoadingAtom);

	styles.useVariants({ loading: isLoading });
	return (
		<Pressable onPress={isPlaying ? pause : play}>
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
		variants: {
			loading: { true: {}, false: {} },
		},
	},
	content: {
		flexDirection: "row",
		gap: theme.gap(1),
		padding: theme.gap(0.75),
		paddingBottom: theme.gap(0.75 + 1 / 3),
		variants: {
			loading: { true: {}, false: {} },
		},
	},
	text: {
		justifyContent: "space-evenly",
		flex: 1,
		variants: {
			loading: { true: {}, false: {} },
		},
	},
	progessPosition: {
		backgroundColor: theme.colors.text.primary,
		height: theme.gap(1 / 3),
		position: "absolute",
		bottom: 0,
		overflow: "hidden",
		borderBottomEndRadius: theme.borderRadius,
		borderTopEndRadius: theme.borderRadius,
		variants: {
			loading: { true: {}, false: {} },
		},
	},
	videoContainer: { borderRadius: theme.borderRadius, overflow: "hidden" },
	video: {
		aspectRatio: 16 / 9,
		height: "100%",
	},
	illustration: {
		height: theme.gap(5.5),
		variants: {
			loading: { true: {}, false: {} },
		},
	},
	controlButton: {
		size: theme.fontSize.rem(1.5),
		variants: {
			loading: { true: { opacity: 0.8 }, false: { opacity: 1 } },
		},
	} as {},
	rewindButton: {
		display: { xs: "none", sm: "flex" },
		variants: {
			loading: { true: {}, false: {} },
		},
	},
	controls: {
		flexDirection: "row",
		gap: theme.gap(2),
		paddingHorizontal: theme.gap(1),
		alignItems: "center",
		variants: {
			loading: { true: {}, false: {} },
		},
	},
}));
