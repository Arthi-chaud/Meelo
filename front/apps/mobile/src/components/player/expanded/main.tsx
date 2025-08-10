import { useBottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { getArtist } from "@/api/queries";
import { skipTrackAtom } from "@/state/player";
import { ForwardIcon, PauseIcon, RewindIcon } from "@/ui/icons";
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
import { getTrackForContextMenu } from "../queries";
import { currentTrackAtom } from "../state";
import { useFormattedArtistName } from "../utils";
import { Slider } from "./slider";

export const Main = () => {
	const currentTrack = useAtomValue(currentTrackAtom);
	return (
		<>
			<View style={styles.illustration}>
				<Illustration
					illustration={currentTrack?.track.illustration}
					quality="high"
					useBlurhash
					variant="center"
				/>
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
	const queryClient = useQueryClient();
	const skipTrack = useSetAtom(skipTrackAtom);
	return (
		<View style={styles.playControls}>
			{/* TODO */}
			<Pressable onPress={() => {}}>
				<Icon icon={RewindIcon} />
			</Pressable>
			{/* TODO */}
			<Pressable onPress={() => {}}>
				<Icon icon={PauseIcon} />
			</Pressable>
			<Pressable onPress={() => skipTrack(queryClient)}>
				<Icon icon={ForwardIcon} />
			</Pressable>
		</View>
	);
};

const ProgressControls = () => {
	const currentTrack = useAtomValue(currentTrackAtom);
	const progress = currentTrack
		? (currentTrack.track.duration ?? 0) / 2
		: undefined;
	return (
		<View style={styles.sliderContainer}>
			<View style={styles.sliderNumbers}>
				<Text content={formatDuration(progress)} />
				<Text content={formatDuration(currentTrack?.track.duration)} />
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
}));
