import { useLocalSearchParams } from "expo-router";
import { useSetAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet } from "react-native-unistyles";
import {
	getAlbums,
	getArtist,
	getArtistExternalMetadata,
	getSongs,
	getVideos,
} from "@/api/queries";
import { type AlbumSortingKey, AlbumType } from "@/models/album";
import { albumTypeToTranslationKey } from "@/models/utils";
import type { VideoSortingKey, VideoWithRelations } from "@/models/video";
import { VideoTypeIsExtra } from "@/models/video";
import { playTracksAtom } from "@/state/player";
import { useInfiniteQuery, useQuery } from "~/api";
import { useSetKeyIllustration } from "~/components/background-gradient";
import {
	ExternalMetadataDescriptionSection,
	ExternalMetadataSourcesSection,
} from "~/components/external-metadata";
import { AlbumTile } from "~/components/item/resource/album";
import { VideoTile } from "~/components/item/resource/video";
import { ArtistHeader } from "~/components/resource-header";
import { Row } from "~/components/row";
import { SafeScrollView } from "~/components/safe-view";
import { SongGrid } from "~/components/song-grid";
import type { Sorting } from "~/utils/sorting";

const albumTypeQuery = (albumType: AlbumType, artistId: string) =>
	getAlbums(
		{ artist: artistId, type: [albumType] },
		{ sortBy: "releaseDate", order: "desc" },
		["illustration", "artist"],
	);

// Note: we show the 'seeMore' button for song grids and video rows iff there's more items than ShowSeeMoreThreshold
// since the user may want to shuffle them through the dedicated page

const ShowSeeMoreThreshold = 3;

export default function ArtistView() {
	const playTracks = useSetAtom(playTracksAtom);
	const { id: artistId } = useLocalSearchParams<{ id: string }>();
	const { t } = useTranslation();

	const { data: artist } = useQuery(() =>
		getArtist(artistId, ["illustration"]),
	);
	const topSongs = useInfiniteQuery(() =>
		getSongs(
			{ artist: artistId },
			{ sortBy: "totalPlayCount", order: "desc" },
			["artist", "featuring", "master", "illustration"],
		),
	);

	const rareSongs = useInfiniteQuery(() =>
		getSongs({ rare: artistId }, { sortBy: "releaseDate", order: "desc" }, [
			"artist",
			"featuring",
			"master",
			"illustration",
		]),
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
	const { data: externalMetadata } = useQuery(
		(artistId) => getArtistExternalMetadata(artistId),
		artistId,
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
	const onVideoPress = useCallback(
		(
			videoId: number,
			items: VideoWithRelations<"artist" | "master" | "illustration">[],
		) => {
			const tracks = items.map(({ master, illustration, artist }) => ({
				track: { ...master, illustration },
				featuring: undefined,
				artist,
			}));
			const cursor = items.findIndex(({ id }) => id === videoId);
			playTracks({ tracks, cursor });
		},
		[],
	);
	useSetKeyIllustration(artist ?? undefined);
	return (
		<SafeScrollView>
			<ArtistHeader artist={artist} />
			<SongGrid
				header={t("artist.topSongs")}
				parentArtistId={artist?.id}
				style={styles.section}
				seeMore={
					(topSongs.items?.length ?? 0) >= ShowSeeMoreThreshold
						? {
								pathname: "/songs",
								params: { artist: artistId },
							}
						: undefined
				}
				songs={topSongs.data?.pages.at(0)?.items}
				subtitle={
					!topSongs.data
						? null
						: (song) =>
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

			<SongGrid
				hideIfEmpty
				header={t("artist.rareSongs")}
				seeMore={
					(rareSongs.items?.length ?? 0) > ShowSeeMoreThreshold
						? { pathname: "/songs", params: { rare: artistId } }
						: undefined
				}
				style={styles.section}
				songs={rareSongs.data?.pages.at(0)?.items}
				parentArtistId={artist?.id}
				subtitle={
					!rareSongs.data
						? null
						: (song) =>
								song.artistId.toString() === artistId &&
								song.featuring.length === 0
									? null
									: "artists"
				}
			/>

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
							onPress={() =>
								item && items && onVideoPress(item.id, items)
							}
							subtitle="duration"
							illustrationProps={{
								normalizedThumbnail: true,
							}}
						/>
					)}
					seeMore={
						(items?.length ?? 0) > ShowSeeMoreThreshold
							? {
									pathname: "/videos",
									params: {
										artist: artistId,
										sort: "name",
										order: "asc",
									} satisfies Sorting<VideoSortingKey> & {
										artist: string;
									},
								}
							: undefined
					}
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

			{externalMetadata !== null && (
				<>
					<ExternalMetadataDescriptionSection
						externalMetadata={externalMetadata}
						style={styles.section}
					/>
					<ExternalMetadataSourcesSection
						externalMetadata={externalMetadata}
						style={styles.section}
					/>
				</>
			)}
		</SafeScrollView>
	);
}

const AlbumTypeRow = ({
	type,
	artistId,
}: {
	type: AlbumType;
	artistId: string;
}) => {
	const { t } = useTranslation();
	const query = useInfiniteQuery(() => albumTypeQuery(type, artistId));
	return (
		<Row
			hideIfEmpty
			style={styles.section}
			header={t(albumTypeToTranslationKey(type, true))}
			items={query.items}
			render={(item) => <AlbumTile album={item} subtitle="year" />}
			seeMore={
				query.hasNextPage
					? {
							pathname: "/albums",
							params: {
								artist: artistId,
								sort: "releaseDate",
								order: "desc",
								type: type,
							} satisfies Sorting<AlbumSortingKey> & {
								type: AlbumType;
								artist: string;
							},
						}
					: undefined
			}
		/>
	);
};

const styles = StyleSheet.create((theme) => ({
	root: {
		flex: 1,
	},
	section: {
		paddingBottom: theme.gap(1),
	},
}));
