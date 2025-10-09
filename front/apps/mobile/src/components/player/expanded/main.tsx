import { useBottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { type ComponentProps, useCallback } from "react";
import { View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { VideoView } from "react-native-video";
import { getArtist } from "@/api/queries";
import { skipTrackAtom } from "@/state/player";
import {
	ForwardIcon,
	FullscreenIcon,
	PauseIcon,
	PlayIcon,
	RewindIcon,
} from "@/ui/icons";
import formatDuration from "@/utils/format-duration";
import { useQuery, useQueryClient } from "~/api";
import { useContextMenu } from "~/components/context-menu";
import { useArtistContextMenu } from "~/components/context-menu/resource/artist";
import { useTrackContextMenu } from "~/components/context-menu/resource/track";
import { Illustration } from "~/components/illustration";
import { LoadableText } from "~/components/loadable_text";
import { useAccentColor } from "~/hooks/accent-color";
import { Button } from "~/primitives/button";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";
import { Text } from "~/primitives/text";
import { breakpoints } from "~/theme";
import { videoPlayerAtom } from "../context";
import { getTrackForContextMenu } from "../queries";
import { Slider } from "../slider";
import {
	currentTrackAtom,
	durationAtom,
	isPlayingAtom,
	pauseAtom,
	playAtom,
	progressAtom,
	rewindTrackAtom,
} from "../state";
import { useFormattedArtistName } from "../utils";

export const Main = () => {
	const { rt: _rt } = useUnistyles();
	return (
		<>
			<View style={styles.illustrationContainer}>
				<View style={styles.illustration}>
					<IllustrationOrVideo />
				</View>
			</View>
			<View style={styles.controls}>
				<WithFullScreenButton>
					<TrackNameButton />
				</WithFullScreenButton>
				<ArtistNameButton />
				<PlayControls />
				<ProgressControls />
			</View>
		</>
	);
};

const PlayControls = () => {
	const isPlaying = useAtomValue(isPlayingAtom);
	const play = useSetAtom(playAtom);
	const pause = useSetAtom(pauseAtom);
	const queryClient = useQueryClient();
	const skipTrack = useSetAtom(skipTrackAtom);
	const rewindTrack = useSetAtom(rewindTrackAtom);
	return (
		<View style={styles.playControls}>
			<Pressable onPress={rewindTrack}>
				<Icon icon={RewindIcon} />
			</Pressable>
			<Pressable onPress={() => (isPlaying ? pause() : play())}>
				<Icon icon={isPlaying ? PauseIcon : PlayIcon} />
			</Pressable>
			<Pressable onPress={() => skipTrack(queryClient)}>
				<Icon icon={ForwardIcon} />
			</Pressable>
		</View>
	);
};

const ProgressControls = () => {
	const currentTrack = useAtomValue(currentTrackAtom);
	const accentColor = useAccentColor(currentTrack?.track.illustration);
	const progress = useAtomValue(progressAtom);
	const duration = useAtomValue(durationAtom);

	//Note: the progress/duration atoms are not cleared correctly when there is not track playing
	return (
		<View style={styles.sliderContainer}>
			<View style={styles.sliderNumbers}>
				<Text
					content={formatDuration(
						currentTrack ? progress : undefined,
					)}
				/>
				<Text
					content={formatDuration(
						currentTrack
							? (duration ?? currentTrack?.track.duration)
							: undefined,
					)}
				/>
			</View>
			<Slider sliderColor={accentColor} trackColor={`${accentColor}30`} />
		</View>
	);
};

const WithFullScreenButton = ({ children }: ComponentProps<any>) => {
	const [currentTrack] = useAtom(currentTrackAtom);
	const isVideo = currentTrack?.track.type === "Video";
	const router = useRouter();
	const onPress = useCallback(() => {
		router.push("/video-player");
	}, [router]);

	styles.useVariants({ isVideo });
	return (
		<View style={styles.fullscreenButtonRow}>
			{isVideo && (
				<Button size="small" icon={FullscreenIcon} onPress={onPress} />
			)}
			{children}

			{/* NOTE: it's for the horzontal padding of the title to be symmetrical */}
			{isVideo && (
				<View style={{ opacity: 0 }}>
					<Button
						size="small"
						icon={FullscreenIcon}
						onPress={() => {}}
					/>
				</View>
			)}
		</View>
	);
};

const TrackNameButton = () => {
	const router = useRouter();
	const { dismiss } = useBottomSheetModal();
	const currentTrack = useAtomValue(currentTrackAtom);
	const { data: track } = useQuery(
		getTrackForContextMenu,
		currentTrack?.track.id,
	);

	const trackContextMenu = useTrackContextMenu(track);
	const { openContextMenu } = useContextMenu(trackContextMenu);

	const onPress = useCallback(() => {
		if (currentTrack?.track.releaseId) {
			router.navigate(`/releases/${currentTrack.track.releaseId}`);
			dismiss();
		} else if (currentTrack?.track.songId) {
			router.navigate(`/songs/${currentTrack.track.songId}`);
			dismiss();
		}
	}, [currentTrack]);
	return (
		<Pressable
			onPress={onPress}
			disabled={
				!currentTrack?.track.songId && !currentTrack?.track.releaseId
			}
			onLongPress={openContextMenu}
		>
			<LoadableText
				content={currentTrack?.track.name}
				variant="h4"
				skeletonWidth={20}
				numberOfLines={1}
			/>
		</Pressable>
	);
};

const ArtistNameButton = () => {
	const router = useRouter();
	const { dismiss } = useBottomSheetModal();
	const currentTrack = useAtomValue(currentTrackAtom);
	const { data: artist } = useQuery(
		(artistId) => getArtist(artistId, ["illustration"]),
		currentTrack?.artist.id,
	);
	const artistContextMenu = useArtistContextMenu(artist);
	const { openContextMenu } = useContextMenu(artistContextMenu);
	const onPress = useCallback(() => {
		if (!currentTrack) {
			return;
		}
		dismiss();
		router.navigate(`/artists/${currentTrack?.artist.id}`);
	}, [currentTrack]);

	const formattedArtistName = useFormattedArtistName();
	return (
		<Pressable onPress={onPress} onLongPress={openContextMenu}>
			<LoadableText
				content={formattedArtistName}
				variant="h5"
				skeletonWidth={20}
				numberOfLines={1}
			/>
		</Pressable>
	);
};

const IllustrationOrVideo = () => {
	const player = useAtomValue(videoPlayerAtom);
	const currentTrack = useAtomValue(currentTrackAtom);

	if (currentTrack?.track.type === "Video" && player) {
		return <VideoView player={player} style={styles.video} />;
	}
	return (
		<Illustration
			illustration={currentTrack?.track.illustration}
			dropShadow
			quality="original"
			useBlurhash
			variant="center"
		/>
	);
};

const styles = StyleSheet.create((theme, _rt) => ({
	illustrationContainer: {
		width: "100%",
		aspectRatio: 1,
		alignItems: "center",
		justifyContent: "center",
		maxHeight: "60%",
		maxWidth: breakpoints.sm,
	},
	illustration: {
		aspectRatio: 1,
		width: "100%",
		alignItems: "center",
	},
	controls: {
		flex: 1,
		width: "100%",
		justifyContent: "space-evenly",
		alignItems: "center",
	},
	sliderContainer: {
		width: "100%",
		maxWidth: breakpoints.md,
		gap: theme.gap(1),
	},
	sliderNumbers: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	playControls: {
		width: "100%",
		maxWidth: breakpoints.sm,
		flexDirection: "row",
		justifyContent: "space-evenly",
	},
	fullscreenButtonRow: {
		flexDirection: "row",
		width: "100%",
		justifyContent: "space-between",
		alignItems: "center",
		variants: {
			isVideo: {
				true: { justifyContent: "space-between" },
				false: { justifyContent: "center" },
			},
		},
	},
	video: {
		width: "100%",
		height: "100%",
	},
}));
