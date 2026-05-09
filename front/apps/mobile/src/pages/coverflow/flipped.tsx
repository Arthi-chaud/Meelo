import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useSetAtom } from "jotai";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { transformPage } from "@/api/query";
import type { AlbumWithRelations } from "@/models/album";
import { playFromInfiniteQuery } from "@/state/player";
import { formatArtists_ } from "@/utils/format-artists";
import { useInfiniteQuery, useQueryClient } from "~/api";
import { Illustration } from "~/components/illustration";
import { LoadableText } from "~/components/loadable_text";
import { Divider } from "~/primitives/divider";
import { Pressable } from "~/primitives/pressable";
import { releaseTracklistQuery } from "../release/queries";
import { TrackItem } from "../release/tracklist";

export const FlippedCard = ({
	album,
	flipped,
}: {
	album: AlbumWithRelations<"artists" | "illustration">;
	flipped: boolean;
}) => {
	const router = useRouter();
	const { t } = useTranslation();
	const queryClient = useQueryClient();
	const tracks = useInfiniteQuery(
		(id) => releaseTracklistQuery(id),
		!flipped ? undefined : (album.masterId ?? undefined),
	);
	const queryForPlayer = () =>
		transformPage(
			releaseTracklistQuery(album.masterId!),
			({ song, video, ...track }) => ({
				id: track.id,
				track,
				artist: song?.artist ?? video!.artist,
				featuring: song?.featuring ?? [],
			}),
		);
	const playFromTracklist = useSetAtom(playFromInfiniteQuery);
	const onPress = useCallback(
		(track: { id: number }) => {
			// playFromTracklist(
			// 	queryForPlayer(),
			// 	queryClient,
			// 	undefined,
			// 	track.id,
			// );
		},
		[playFromTracklist, queryForPlayer, queryClient],
	);
	if (!flipped) {
		return <View style={styles.root} />;
	}
	return (
		<FlashList
			style={styles.root}
			data={tracks.items}
			ListHeaderComponent={
				<Pressable
					style={styles.header}
					onPress={() => {
						if (album.masterId)
							router.replace(`/releases/${album.masterId}`);
					}}
				>
					<View style={styles.headerTexts}>
						<LoadableText
							content={album.name}
							skeletonWidth={10}
							numberOfLines={1}
							style={styles.headerText}
							variant="itemLabel"
						/>
						<LoadableText
							content={
								album.artists.length === 0
									? t("compilationArtistLabel")
									: formatArtists_(album.artists)
							} // TODO:
							skeletonWidth={10}
							numberOfLines={1}
							color="secondary"
							style={styles.headerText}
							variant="itemText"
						/>
					</View>
					<View style={styles.headerIllustration}>
						<Illustration
							illustration={album.illustration}
							quality="low"
							variant="center"
						/>
					</View>
				</Pressable>
			}
			ItemSeparatorComponent={() => <Divider h withInsets />}
			renderItem={({ item: track }) => (
				<TrackItem
					track={track}
					onPress={() => onPress(track)}
					albumArtists={album.artists}
					removeContextMenu
					compact
					maxTrackIndex={10}
				/>
			)}
		/>
	);
};
const styles = StyleSheet.create((theme) => ({
	root: {
		aspectRatio: 1,
		height: "100%",
		width: "100%",
		backgroundColor: theme.colors.background,
		borderRadius: theme.borderRadius,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		gap: theme.gap(1),
		paddingTop: theme.gap(1.5),
		paddingHorizontal: theme.gap(1.5),
		paddingBottom: theme.gap(1),
	},
	headerTexts: { flexShrink: 1 },
	headerText: { fontSize: theme.fontSize.default },
	headerIllustration: { aspectRatio: 1, height: theme.gap(5.5) },
}));
