import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useAtomValue, useSetAtom } from "jotai";
import { Fragment, useCallback, useMemo } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
	cursorAtom,
	playlistAtom,
	removeTrackAtom,
	skipTrackAtom,
	type TrackState,
} from "@/state/player";
import { DeleteIcon } from "@/ui/icons";
import { useQueryClient } from "~/api";
import { ListItem } from "~/components/item/list-item";
import { Divider } from "~/primitives/divider";
import { Icon } from "~/primitives/icon";
import { Pressable } from "~/primitives/pressable";

//TODO Reorder

export const Queue = () => {
	const queryClient = useQueryClient();
	const playlist = useAtomValue(playlistAtom);
	const removeTrack = useSetAtom(removeTrackAtom);
	const cursor = useAtomValue(cursorAtom);
	const skipTrack = useSetAtom(skipTrackAtom);
	const queue = useMemo(() => playlist.slice(cursor + 1), [playlist, cursor]);
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
	return (
		<View style={styles.root}>
			<Divider h />
			<BottomSheetScrollView>
				{queue.map((track, idx) => (
					<Fragment key={idx}>
						<QueueItem
							track={track}
							onPress={() => onItemPress(idx)}
							onDelete={() => onItemDelete(idx)}
						/>
						{idx !== queue.length - 1 && <Divider h />}
					</Fragment>
				))}
			</BottomSheetScrollView>
		</View>
	);
};

const QueueItem = ({
	track: { track, artist },
	onPress,
	onDelete,
}: {
	track: TrackState;
	onPress: () => void;
	onDelete: () => void;
}) => {
	return (
		<ListItem
			title={track.name}
			subtitle={artist.name}
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
