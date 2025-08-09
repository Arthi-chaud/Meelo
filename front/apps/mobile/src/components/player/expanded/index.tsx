import { BottomSheetHandle, useBottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useAtomValue, useSetAtom } from "jotai";
import { type ReactElement, useCallback } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import { getArtist, getTrack } from "@/api/queries";
import { skipTrackAtom } from "@/state/player";
import { ForwardIcon, PauseIcon, RewindIcon } from "@/ui/icons";
import { useQuery, useQueryClient } from "~/api";
import { useContextMenu } from "~/components/context-menu";
import { useArtistContextMenu } from "~/components/context-menu/resource/artist";
import { useTrackContextMenu } from "~/components/context-menu/resource/track";
import { Illustration } from "~/components/illustration";
import { LoadableText } from "~/components/loadable_text";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";
import { breakpoints } from "~/theme";
import { currentTrackAtom } from "../state";
import { ColorBackground, useFormattedArtistName } from "../utils";

//TODO pause/play state
//TODO Slider
//TODO Footer

export const ExpandedPlayer = () => {
	const insets = useSafeAreaInsets();
	const currentTrack = useAtomValue(currentTrackAtom);

	return (
		<View style={[styles.root, { paddingTop: insets.top }]}>
			<Handle />
			<ColorBackground />
			<View style={styles.content}>
				<View style={styles.illustration}>
					<Illustration
						illustration={currentTrack?.track.illustration}
						quality="high"
						useBlurhash
						variant="center"
					/>
				</View>

				<View
					style={{
						alignItems: "center",
						width: "100%",
						flex: 1,
						justifyContent: "space-evenly",
					}}
				>
					<TrackNameButton />
					<ArtistNameButton />
					<Controls />
				</View>
			</View>
		</View>
	);
};

const Handle = BottomSheetHandle as unknown as () => ReactElement;

const Controls = () => {
	const queryClient = useQueryClient();
	const skipTrack = useSetAtom(skipTrackAtom);
	return (
		<View style={styles.controls}>
			<Pressable>
				<Icon icon={RewindIcon} />
			</Pressable>

			<Pressable>
				<Icon icon={PauseIcon} />
			</Pressable>

			<Pressable onPress={() => skipTrack(queryClient)}>
				<Icon icon={ForwardIcon} />
			</Pressable>
		</View>
	);
};

const TrackNameButton = () => {
	const router = useRouter();
	const { dismiss } = useBottomSheetModal();
	const currentTrack = useAtomValue(currentTrackAtom);
	const { data: track } = useQuery(
		(trackId) =>
			getTrack(trackId, ["song", "video", "release", "illustration"]),
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
	root: {
		flex: 1,
		width: "100%",
	},
	content: {
		width: "100%",
		flex: 1,
		paddingHorizontal: theme.gap(2),
		maxWidth: breakpoints.md,
		alignItems: "center",
		gap: theme.gap(3),
	},
	illustration: {
		aspectRatio: 1,
		width: "100%",
		alignItems: "center",
	},
	controls: {
		width: "100%",
		flexDirection: "row",
		justifyContent: "space-evenly",
	},
}));
