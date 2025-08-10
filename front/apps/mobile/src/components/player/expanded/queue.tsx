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
import { DeleteIcon } from "@/ui/icons";
import { useQueryClient } from "~/api";
import { ListItem } from "~/components/item/list-item";
import { Divider } from "~/primitives/divider";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";

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
				{/* @ts-expect-error */}
				<DraggableFlatList
					data={queue}
					onDragEnd={({ from, to }) => onDragEnd(from, to)}
					keyExtractor={([t, idx]) => `${t.track.id}-${idx}`}
					renderItem={({ item: [t, idx], drag }) => (
						/* @ts-expect-error */
						<ScaleDecorator>
							<QueueItem
								onDrag={drag}
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
	track: { track, artist },
	onPress,
	onDelete,
	onDrag,
}: {
	track: TrackState;
	onPress: () => void;
	onDrag: () => void;
	onDelete: () => void;
}) => {
	return (
		<ListItem
			title={track.name}
			subtitle={artist.name}
			onLongPress={onDrag}
			illustration={track.illustration}
			illustrationProps={{
				variant: "center",
				normalizedThumbnail: track.type === "Video",
			}}
			onPress={onPress}
			trailing={
				<Pressable onPress={onDelete}>
					<Icon icon={DeleteIcon} style={styles.deleteIcon} />
				</Pressable>
			}
		/>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: { width: "100%", flex: 1 },
	deleteIcon: { color: theme.colors.error },
}));
