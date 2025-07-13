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
import { LoadableText } from "~/components/loadable_text";
import { Row } from "~/components/row";
import { SongGrid } from "~/components/song-grid";
import { AlbumTile } from "~/components/tile/resource/album";
import { VideoTile } from "~/components/tile/resource/video";

const albumTypeQuery = (albumType: AlbumType, artistId: string) =>
	getAlbums(
		{ artist: artistId, type: [albumType] },
		{ sortBy: "releaseDate", order: "desc" },
		["illustration", "artist"],
	);

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
	const relatedAlbums = useInfiniteQuery(() =>
		getAlbums(
			{ appearance: artistId },
			{ sortBy: "releaseDate", order: "desc" },
			["artist", "illustration"],
		),
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
			{/* TODO Duplicated header when from home tab */}
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
					<AlbumTypeRow
						key={albumType}
						artistId={artistId}
						type={albumType}
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
				<Row
					hideIfEmpty
					style={styles.section}
					header={t("artist.appearsOn")}
					items={relatedAlbums.items}
					render={(album) => (
						<AlbumTile album={album} subtitle="artistName" />
					)}
				/>

				{/* TODO Rare songs*/}
				{/* TODO external metadata*/}
			</ScrollView>
		</>
	);
}

const AlbumTypeRow = ({
	type,
	artistId,
}: { type: AlbumType; artistId: string }) => {
	const { t } = useTranslation();
	const query = useInfiniteQuery(() => albumTypeQuery(type, artistId));
	return (
		<Row
			hideIfEmpty
			style={styles.section}
			header={t(albumTypeToTranslationKey(type, true))}
			items={query.items}
			render={(item) => <AlbumTile album={item} subtitle="year" />}
		/>
	);
};

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
