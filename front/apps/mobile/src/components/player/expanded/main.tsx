import { useBottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { VideoView } from "react-native-video";
import { getArtist } from "@/api/queries";
import { playPreviousTrackAtom, skipTrackAtom } from "@/state/player";
import { store } from "@/state/store";
import { ForwardIcon, PauseIcon, PlayIcon, RewindIcon } from "@/ui/icons";
import formatDuration from "@/utils/format-duration";
import { useQuery, useQueryClient } from "~/api";
import { useContextMenu } from "~/components/context-menu";
import { useArtistContextMenu } from "~/components/context-menu/resource/artist";
import { useTrackContextMenu } from "~/components/context-menu/resource/track";
import { Illustration } from "~/components/illustration";
import { LoadableText } from "~/components/loadable_text";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";
import { Text } from "~/primitives/text";
import { videoPlayerAtom } from "../context";
import { getTrackForContextMenu } from "../queries";
import {
	currentTrackAtom,
	durationAtom,
	isPlayingAtom,
	pauseAtom,
	playAtom,
	progressAtom,
	requestedProgressAtom,
} from "../state";
import { useFormattedArtistName } from "../utils";
import { Slider } from "./slider";

export const Main = () => {
	return (
		<>
			<View style={styles.illustration}>
				<IllustrationOrVideo />
			</View>
			<View style={styles.controls}>
				<TrackNameButton />
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
	const requestProgress = useSetAtom(requestedProgressAtom);
	const queryClient = useQueryClient();
	const skipTrack = useSetAtom(skipTrackAtom);
	const playPreviousTrack = useSetAtom(playPreviousTrackAtom);
	const onRewind = useCallback(() => {
		const progress = store.get(progressAtom);
		if (progress > 5) {
			requestProgress(0);
		} else {
			playPreviousTrack();
		}
	}, [playPreviousTrackAtom, requestProgress]);
	return (
		<View style={styles.playControls}>
			<Pressable onPress={onRewind}>
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
	const progress = useAtomValue(progressAtom);
	const duration = useAtomValue(durationAtom);
	return (
		<View style={styles.sliderContainer}>
			<View style={styles.sliderNumbers}>
				<Text content={formatDuration(progress)} />
				<Text
					content={formatDuration(
						duration ?? currentTrack?.track.duration,
					)}
				/>
			</View>
			<Slider />
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
		if (!currentTrack?.track.songId) {
			return;
		}
		dismiss();
		router.push(`/songs/${currentTrack.track.songId}`);
	}, [currentTrack]);
	return (
		<Pressable
			onPress={onPress}
			disabled={!currentTrack?.track.songId}
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
		router.push(`/artists/${currentTrack?.artist.id}`);
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
			quality="original"
			useBlurhash
			variant="center"
		/>
	);
};

const styles = StyleSheet.create((theme) => ({
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
		gap: theme.gap(1),
	},
	sliderNumbers: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	playControls: {
		width: "100%",
		flexDirection: "row",
		justifyContent: "space-evenly",
	},
	video: {
		width: "100%",
		height: "100%",
	},
}));
