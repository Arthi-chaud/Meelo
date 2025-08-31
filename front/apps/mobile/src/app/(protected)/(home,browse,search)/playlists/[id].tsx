import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSetAtom } from "jotai";
import { shuffle } from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import DraggableFlatList, {
	ScaleDecorator,
} from "react-native-draggable-flatlist";
import { StyleSheet } from "react-native-unistyles";
import {
	getCurrentUserStatus,
	getPlaylist,
	getPlaylistEntries,
} from "@/api/queries";
import type { PlaylistEntryWithRelations } from "@/models/playlist";
import { playTracksAtom } from "@/state/player";
import {
	DeleteIcon,
	DoneIcon,
	PlayIcon,
	PlaylistIcon,
	ReorderPlaylistIcon,
	ShuffleIcon,
} from "@/ui/icons";
import { generateArray } from "@/utils/gen-list";
import { useAPI, useQuery, useQueryClient } from "~/api";
import { SongItem } from "~/components/item/resource/song";
import { ResourceHeader } from "~/components/resource-header";
import { useRootViewStyle } from "~/hooks/root-view-style";
import { Button } from "~/primitives/button";
import { Divider } from "~/primitives/divider";

type PlaylistEntryType = PlaylistEntryWithRelations<
	"illustration" | "artist" | "featuring" | "master"
>;

const playlistQuery = (playlistId: string | number) =>
	getPlaylist(playlistId, ["illustration"]);

export default function PlaylistView() {
	const rootStyle = useRootViewStyle();
	const queryClient = useQueryClient();
	const { id: playlistId } = useLocalSearchParams<{ id: string }>();
	const playTracks = useSetAtom(playTracksAtom);

	// Data
	const { data: playlistEntries, refetch: refetchEntries } = useQuery(() => {
		const query = getPlaylistEntries(playlistId, [
			"illustration",
			"artist",
			"featuring",
			"master",
		]);
		return {
			key: [...query.key, "full"],
			exec: (api) => () => query.exec(api)({ pageSize: 1000 }),
		};
	});
	// Reorder
	const [isReordering, setIsReordering] = useState(false);
	const reorderEntries = useMutation({
		mutationFn: async (entriesIds: number[]) => {
			await queryClient.api.reorderPlaylist(playlistId, entriesIds);
			refetchEntries();
		},
	});

	// Playback
	const tracksForPlayer = useMemo(
		() =>
			playlistEntries?.items.map((item) => ({
				track: { ...item.master, illustration: item.illustration },
				artist: item.artist,
			})) ?? [],
		[playlistEntries],
	);
	const onItemPress = useCallback(
		(index: number) => {
			playTracks({ tracks: tracksForPlayer, cursor: index });
		},
		[playlistEntries],
	);
	const onShuffle = useCallback(() => {
		playTracks({ tracks: shuffle(tracksForPlayer) });
	}, [playlistEntries]);
	return (
		<View style={[styles.root, rootStyle]}>
			<Header
				playlistId={playlistId}
				{...(playlistEntries && !isReordering
					? { onPlay: () => onItemPress(0), onShuffle: onShuffle }
					: {})}
			/>
			<Divider h />
			<Items
				playlistId={playlistId}
				playlistEntries={playlistEntries?.items}
				isReordering={isReordering}
				startReordering={() => setIsReordering(true)}
				onReorderingEnd={(entryIds) => {
					setIsReordering(false);
					reorderEntries.mutate(entryIds);
				}}
				onItemPress={onItemPress}
			/>
		</View>
	);
}

const Header = ({
	playlistId,
	onPlay,
	onShuffle,
}: {
	playlistId: number | string;
	onShuffle?: () => void;
	onPlay?: () => void;
}) => {
	const { t } = useTranslation();
	const { data: playlist } = useQuery(() => playlistQuery(playlistId));

	return (
		<>
			<ResourceHeader
				title={playlist?.name}
				subtitle={null}
				illustration={playlist?.illustration}
				illustrationProps={{ fallbackIcon: PlaylistIcon }}
			/>
			<View style={styles.playButtons}>
				<View style={styles.playButton}>
					<Button
						title={t("actions.playback.play")}
						icon={PlayIcon}
						disabled={!onPlay}
						onPress={() => onPlay?.()}
						containerStyle={styles.playButtonContent}
					/>
				</View>
				<View style={styles.playButton}>
					<Button
						title={t("actions.playback.shuffle")}
						disabled={!onShuffle}
						icon={ShuffleIcon}
						onPress={() => onShuffle?.()}
						containerStyle={styles.playButtonContent}
					/>
				</View>
			</View>
		</>
	);
};

const Items = ({
	playlistEntries,
	isReordering,
	playlistId,
	startReordering,
	onReorderingEnd,
	onItemPress,
}: {
	onItemPress: (index: number) => void;
	playlistId: string | number;
	isReordering: boolean;
	startReordering: () => void;
	onReorderingEnd: (reorderedEntryIds: number[]) => void;
	playlistEntries: PlaylistEntryType[] | undefined;
}) => {
	const reorderedIds = useRef<number[]>([]);
	const reorder = useCallback(
		(from: number, to: number) => {
			[reorderedIds.current[to], reorderedIds.current[from]] = [
				reorderedIds.current[from],
				reorderedIds.current[to],
			];
		},
		[playlistEntries],
	);
	useEffect(() => {
		reorderedIds.current =
			playlistEntries?.map(({ entryId }) => entryId) ?? [];
	}, [isReordering, playlistEntries]);
	return (
		/* @ts-expect-error */
		<DraggableFlatList
			containerStyle={styles.itemsContainer}
			contentContainerStyle={styles.items}
			data={playlistEntries ?? generateArray(20)}
			onDragEnd={({ from, to }) => reorder(from, to)}
			keyExtractor={(item: PlaylistEntryType | undefined, idx) =>
				item?.entryId.toString() ?? `skeleton-${idx}`
			}
			renderItem={({ item, drag, getIndex }) => (
				/* @ts-expect-error */
				<ScaleDecorator>
					<SongItem
						song={item}
						subtitle="artists"
						onLongPress={isReordering ? drag : undefined}
						illustrationProps={{}}
						onPress={() => onItemPress(getIndex()!)}
					/>
					<Divider h />
				</ScaleDecorator>
			)}
			ListFooterComponent={
				<Footer
					playlistId={playlistId}
					isReordering={isReordering}
					startReorder={startReordering}
					finishReorder={() => onReorderingEnd(reorderedIds.current)}
				/>
			}
		/>
	);
};

const Footer = ({
	playlistId,
	isReordering,
	startReorder,
	finishReorder,
}: {
	playlistId: number | string;
	isReordering: boolean;
	startReorder: () => void;
	finishReorder: () => void;
}) => {
	const { t } = useTranslation();
	const { data: playlist } = useQuery(() => playlistQuery(playlistId));
	const { data: user } = useQuery(getCurrentUserStatus);
	const queryClient = useQueryClient();
	const router = useRouter();
	const api = useAPI();
	const userIsAdmin = useMemo(
		() => playlist && user && playlist.ownerId === user.id,
		[user, playlist],
	);
	const userCanEdit = useMemo(
		() => playlist && user && (userIsAdmin || playlist.allowChanges),
		[user, playlist, userIsAdmin],
	);
	const deletePlaylist = useMutation({
		mutationFn: () =>
			api.deletePlaylist(playlistId).then(() => {
				queryClient.client.invalidateQueries({
					queryKey: ["playlists"],
				});
				router.dismiss();
			}),
	});

	return (
		<View style={styles.footer}>
			{userCanEdit && (
				<Button
					size="small"
					// @ts-expect-error
					icon={isReordering ? DoneIcon : ReorderPlaylistIcon}
					title={t(
						isReordering ? "form.done" : "form.playlist.reorder",
					)}
					onPress={isReordering ? finishReorder : startReorder}
				/>
			)}
			{userIsAdmin && (
				<Button
					size="small"
					disabled={isReordering}
					icon={DeleteIcon}
					title={t("actions.delete")}
					onPress={() => userIsAdmin && deletePlaylist.mutate()}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: { flex: 1 },
	playButtons: {
		flexDirection: "row",
		gap: theme.gap(1),
		padding: theme.gap(1),
		paddingTop: 0,
	},
	playButton: { flex: 1 },
	playButtonContent: { justifyContent: "center" },
	itemsContainer: { flex: 1 },
	items: { padding: theme.gap(1), paddingTop: 0 },
	footer: {
		flexDirection: "row",
		justifyContent: "flex-end",
		width: "100%",
		gap: theme.gap(1),
		paddingVertical: theme.gap(1),
	},
}));
