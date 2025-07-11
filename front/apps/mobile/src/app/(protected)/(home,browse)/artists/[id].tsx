import { getAlbums, getArtist, getSongs, getVideos } from "@/api/queries";
import { AlbumType } from "@/models/album";
import { albumTypeToTranslationKey } from "@/models/utils";
import { VideoTypeIsExtra } from "@/models/video";
import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useInfiniteQuery, useQuery } from "~/api";
import { Illustration } from "~/components/illustration";
import { InfiniteRow, Row } from "~/components/infinite/row";
import { LoadableText } from "~/components/loadable_text";
import { SongGrid } from "~/components/song-grid";
import { AlbumTile } from "~/components/tile/resource/album";
import { VideoTile } from "~/components/tile/resource/video";

export default function ArtistView() {
	const { id } = useLocalSearchParams();
	const { t } = useTranslation();
	const artistId = id.toString();
	const topSongs = useInfiniteQuery(() =>
		getSongs(
			{ artist: artistId },
			{ sortBy: "totalPlayCount", order: "desc" },
			["artist", "featuring", "master", "illustration"],
		),
	);
	const videos = useInfiniteQuery(() =>
		getVideos({ artist: artistId }, { sortBy: "addDate", order: "desc" }, [
			"artist",
			"master",
			"illustration",
		]),
	);
	const { musicVideos, liveVideos, extras } = useMemo(() => {
		return {
			musicVideos: videos.items?.filter(
				(video) =>
					!VideoTypeIsExtra(video.type) && video.type !== "Live",
			),
			liveVideos: videos.items?.filter((video) => video.type === "Live"),
			extras: videos.items?.filter((video) =>
				VideoTypeIsExtra(video.type),
			),
		};
	}, [videos]);

	return (
		<>
			<Stack.Screen options={{ headerTitle: "", headerShown: true }} />
			<ScrollView style={styles.root}>
				<Header artistId={artistId} />
				<SongGrid
					header={t("artist.topSongs")}
					style={styles.section}
					songs={topSongs.data?.pages.at(0)?.items}
					subtitle={(song) =>
						song.artistId.toString() === artistId &&
						song.featuring.length === 0
							? null
							: "artists"
					}
				/>
				{AlbumType.map((albumType) => (
					<InfiniteRow
						hideIfEmpty
						key={albumType}
						style={styles.section}
						header={t(albumTypeToTranslationKey(albumType, true))}
						query={getAlbums(
							{ artist: artistId, type: [albumType] },
							{ sortBy: "releaseDate", order: "desc" },
							["illustration", "artist"],
						)}
						render={(item) => <AlbumTile album={item} />}
					/>
				))}
				{(
					[
						{ label: "musicVideos", items: musicVideos },
						{ label: "livePerformances", items: liveVideos },
						{ label: "extras", items: extras },
					] as const
				).map(({ label, items }) => (
					<Row
						hideIfEmpty
						key={label}
						items={items}
						style={styles.section}
						header={t(`browsing.sections.${label}`)}
						render={(item) => (
							<VideoTile
								video={item}
								subtitle="duration"
								illustrationProps={{
									normalizedThumbnail: true,
								}}
							/>
						)}
					/>
				))}
				<InfiniteRow
					hideIfEmpty
					style={styles.section}
					header={t("artist.appearsOn")}
					query={getAlbums(
						{ appearance: artistId },
						{ sortBy: "releaseDate", order: "desc" },
						["artist", "illustration"],
					)}
					render={(album) => <AlbumTile album={album} />}
				/>

				{/* TODO Rare songs*/}
				{/* TODO external metadata*/}
			</ScrollView>
		</>
	);
}

const Header = ({ artistId }: { artistId: string }) => {
	const { data: artist } = useQuery(() =>
		getArtist(artistId, ["illustration"]),
	);
	return (
		<View style={styles.headerRoot}>
			<View style={styles.headerAvatar}>
				<Illustration
					illustration={artist?.illustration}
					quality="medium"
					variant="circle"
				/>
			</View>
			<View style={styles.headerText}>
				<LoadableText
					content={artist?.name}
					skeletonWidth={10}
					variant="h2"
				/>
			</View>
		</View>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: {
		flex: 1,
	},
	section: {
		paddingBottom: theme.gap(1),
	},
	headerRoot: {
		width: "100%",
		flexDirection: "row",
		alignItems: "center",
		padding: theme.gap(2),
		gap: theme.gap(3),
		display: "flex",
	},
	headerAvatar: {
		flex: 1,
	},

	headerText: {
		flex: { xs: 2, sm: 3, md: 5, xl: 12 },
	},
}));
