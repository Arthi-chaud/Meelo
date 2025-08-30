import { useMutation } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSetAtom } from "jotai";
import { shuffle } from "lodash";
import { Fragment, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
	getCurrentUserStatus,
	getPlaylist,
	getPlaylistEntries,
} from "@/api/queries";
import type { PlaylistEntryWithRelations } from "@/models/playlist";
import { playTracksAtom } from "@/state/player";
import { DeleteIcon, PlayIcon, PlaylistIcon, ShuffleIcon } from "@/ui/icons";
import { generateArray } from "@/utils/gen-list";
import { useAPI, useQuery, useQueryClient } from "~/api";
import { SongItem } from "~/components/item/resource/song";
import { ResourceHeader } from "~/components/resource-header";
import { useRootViewStyle } from "~/hooks/root-view-style";
import { Button } from "~/primitives/button";
import { Divider } from "~/primitives/divider";

//TODO reorder

type PlaylistEntryType = PlaylistEntryWithRelations<
	"illustration" | "artist" | "featuring" | "master"
>;

const playlistQuery = (playlistId: string | number) =>
	getPlaylist(playlistId, ["illustration"]);

export default function PlaylistView() {
	const rootStyle = useRootViewStyle();
	const { id: playlistId } = useLocalSearchParams<{ id: string }>();
	const playTracks = useSetAtom(playTracksAtom);
	const { data: playlistEntries } = useQuery(() => {
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
		<ScrollView style={[styles.root, rootStyle]}>
			<Header
				playlistId={playlistId}
				{...(playlistEntries
					? { onPlay: () => onItemPress(0), onShuffle: onShuffle }
					: {})}
			/>
			<Divider h />
			<View style={styles.items}>
				{(playlistEntries?.items ?? generateArray(20)).map(
					(item: PlaylistEntryType | undefined, idx) => (
						<Fragment key={item?.entryId ?? `skeleton-${idx}`}>
							<SongItem
								song={item}
								subtitle="artists"
								illustrationProps={{}}
								onPress={() => onItemPress(idx)}
							/>
							<Divider h />
						</Fragment>
					),
				)}
			</View>
			<Footer playlistId={playlistId} />
		</ScrollView>
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

const Footer = ({ playlistId }: { playlistId: number | string }) => {
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
			{userIsAdmin && (
				<Button
					size="small"
					icon={DeleteIcon}
					title={t("actions.delete")}
					onPress={() => userIsAdmin && deletePlaylist.mutate()}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: {},
	playButtons: {
		flexDirection: "row",
		gap: theme.gap(1),
		padding: theme.gap(1),
		paddingTop: 0,
	},
	playButton: { flex: 1 },
	playButtonContent: { justifyContent: "center" },
	items: { padding: theme.gap(1) },
	footer: {
		flexDirection: "row",
		justifyContent: "flex-end",
		width: "100%",
		padding: theme.gap(1),
	},
}));
