import { BottomSheetDraggableView } from "@gorhom/bottom-sheet";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { View } from "react-native";
import DraggableFlatList, {
	ScaleDecorator,
} from "react-native-draggable-flatlist";
import { StyleSheet } from "react-native-unistyles";
import {
	cursorAtom,
	playlistAtom,
	removeTrackAtom,
	reorderAtom,
	skipTrackAtom,
	type TrackState,
} from "@/state/player";
import { DeleteIcon, DownloadIcon } from "@/ui/icons";
import formatArtists from "@/utils/format-artists";
import { useQueryClient } from "~/api";
import { ListItem } from "~/components/item/list-item";
import { useIsDownloaded } from "~/downloads";
import * as Haptics from "~/haptics";
import { Divider } from "~/primitives/divider";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";
import { breakpoints } from "~/theme";

export const Queue = () => {
	const queryClient = useQueryClient();
	const playlist = useAtomValue(playlistAtom);
	const reorderTracks = useSetAtom(reorderAtom);
	const removeTrack = useSetAtom(removeTrackAtom);
	const cursor = useAtomValue(cursorAtom);
	const skipTrack = useSetAtom(skipTrackAtom);
	const queue = useMemo(
		() =>
			playlist
				.slice(cursor + 1)
				.map((track, idx) => [track, idx] as const),
		[playlist, cursor],
	);
	const onItemPress = useCallback(
		(trackOffset: number) => {
			for (let i = 0; i < trackOffset + 1; i++) skipTrack(queryClient);
		},
		[playlist, cursor],
	);
	const onItemDelete = useCallback(
		(trackOffset: number) => {
			removeTrack(cursor + 1 + trackOffset);
		},
		[playlist, cursor, removeTrack],
	);
	const onDragEnd = useCallback(
		(fromOffset: number, toOffset: number) => {
			reorderTracks({
				from: fromOffset + 1 + cursor,
				to: toOffset + 1 + cursor,
			});
		},
		[cursor, reorderTracks],
	);
	return (
		<View style={styles.root}>
			<Divider h />
			<BottomSheetDraggableView>
				<DraggableFlatList
					data={queue}
					onDragEnd={({ from, to }) => onDragEnd(from, to)}
					keyExtractor={([t, idx]) => `${t.track.id}-${idx}`}
					renderItem={({ item: [t, idx], drag }) => (
						<ScaleDecorator>
							<QueueItem
								onDrag={() => {
									drag();
									Haptics.onDragStart();
								}}
								track={t}
								onPress={() => onItemPress(idx)}
								onDelete={() => onItemDelete(idx)}
							/>
							<Divider h />
						</ScaleDecorator>
					)}
				/>
			</BottomSheetDraggableView>
		</View>
	);
};

const QueueItem = ({
	track: { track, artist, featuring },
	onPress,
	onDelete,
	onDrag,
}: {
	track: TrackState;
	onPress: () => void;
	onDrag: () => void;
	onDelete: () => void;
}) => {
	const isDownloaded = useIsDownloaded(track.sourceFileId);
	return (
		<ListItem
			title={track.name}
			subtitle={formatArtists(artist, featuring)}
			onLongPress={onDrag}
			illustration={track.illustration}
			illustrationProps={{
				variant: "center",
				normalizedThumbnail: track.type === "Video",
			}}
			onPress={onPress}
			trailing={
				<View style={styles.trailingRow}>
					{isDownloaded && (
						<Icon
							icon={DownloadIcon}
							variant="Bold"
							style={styles.downloadedIcon}
						/>
					)}
					<Pressable onPress={onDelete}>
						<Icon icon={DeleteIcon} style={styles.deleteIcon} />
					</Pressable>
				</View>
			}
		/>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: { width: "100%", flex: 1, maxWidth: breakpoints.md },
	trailingRow: { flexDirection: "row", gap: theme.gap(1) },
	deleteIcon: { color: theme.colors.error },
	downloadedIcon: { color: theme.colors.divider },
}));
