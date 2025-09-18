import { useSetAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
	getAlbum,
	getAlbumExternalMetadata,
	getGenres,
	getPlaylists,
	getRelease,
} from "@/api/queries";
import type Album from "@/models/album";
import type Genre from "@/models/genre";
import type { TracklistItemWithRelations } from "@/models/tracklist";
import type { VideoWithRelations } from "@/models/video";
import { playTracksAtom } from "@/state/player";
import {
	useBSidesAndExtras,
	useTracklist,
	useVideos,
} from "@/ui/pages/release";
import { generateArray } from "@/utils/gen-list";
import { useInfiniteQuery, useQuery } from "~/api";
import { useSetKeyIllustration } from "~/components/background-gradient";
import { Chip } from "~/components/chip";
import {
	ExternalMetadataDescriptionSection,
	ExternalMetadataSourcesSection,
} from "~/components/external-metadata";
import { AlbumTile } from "~/components/item/resource/album";
import { ArtistTile } from "~/components/item/resource/artist";
import { PlaylistTile } from "~/components/item/resource/playlist";
import ReleaseTile from "~/components/item/resource/release";
import { VideoTile } from "~/components/item/resource/video";
import { Row } from "~/components/row";
import { SectionHeader } from "~/components/section-header";
import { SongGrid } from "~/components/song-grid";
import { Text } from "~/primitives/text";
import { Header } from "./header";
import {
	artistsOnAlbumQuery,
	relatedAlbumsQuery,
	relatedReleasesQuery,
	releaseBSidesQuery,
	releaseTracklistQuery,
	releatedVideos,
} from "./queries";
import { Tracklist } from "./tracklist";

export default function ReleasePage({ releaseId }: { releaseId: string }) {
	const { data: release } = useQuery(() =>
		getRelease(releaseId, ["illustration", "discs"]),
	);

	const { data: album } = useQuery(
		(albumId) => getAlbum(albumId, ["artist"]),
		release?.albumId,
	);
	const { data: discs } = useQuery(() =>
		releaseTracklistQuery(releaseId, false),
	);
	const {
		isMixed,
		tracks: tracks_,
		totalDuration,
		tracklist,
	} = useTracklist(discs);
	const tracks = useMemo(() => {
		return (
			tracks_
				?.filter((t) => t !== undefined)
				.map(({ song, video, ...track }) => ({
					track,
					artist: (song ?? video)!.artist,
					featuring: song?.featuring ?? [],
				})) ?? []
		);
	}, [tracks_]);

	useSetKeyIllustration(release);
	return (
		<>
			<Header
				isMixed={isMixed}
				release={release}
				album={album}
				tracks={tracks}
				totalDuration={totalDuration}
			/>
			<Tracklist
				// Note: We wait for the album to be loaded to avoid a shift in the tracklist
				// if the song artist isn't the album's
				albumArtistId={album?.artistId}
				tracks={album ? tracks : undefined}
				tracklist={album ? (tracklist as any) : undefined} // TODO Avoid cast
				discs={album ? release?.discs : undefined}
			/>
			{/* No need to mount this as long as the release is not loaded */}
			{release !== undefined && (
				<>
					{/* TODO Show only exclusive tracks */}
					{/* TODO Label */}
					<PostTracklistSections
						releaseId={release?.id}
						album={album}
						tracks={tracks_ ?? []}
						albumArtistId={album?.artistId}
					/>
				</>
			)}
		</>
	);
}

const PostTracklistSections = ({
	album,
	releaseId,
	albumArtistId,
	tracks,
}: {
	album: Album | undefined;
	releaseId: number | undefined;
	albumArtistId: number | undefined | null;
	tracks: TracklistItemWithRelations<"artist" | "featuring">[];
}) => {
	const playTracks = useSetAtom(playTracksAtom);
	const { t } = useTranslation();
	const { data: featuringArtists } = useQuery(
		(albumId) => artistsOnAlbumQuery(albumId),
		album?.id,
	);
	const { items: relatedAlbums } = useInfiniteQuery(
		(albumId) => relatedAlbumsQuery(albumId),
		album?.id,
	);

	const { items: relatedPlaylists } = useInfiniteQuery(
		(albumId) =>
			getPlaylists({ album: albumId }, undefined, ["illustration"]),
		album?.id,
	);
	const { items: relatedReleasesItems } = useInfiniteQuery(
		(albumId) => relatedReleasesQuery(albumId),
		album?.id,
	);
	const relatedReleases = useMemo(() => {
		if (!album) {
			return undefined;
		}
		return relatedReleasesItems
			?.filter((r) => r.id !== releaseId)
			.map((r) => ({ ...r, album }));
	}, [relatedReleasesItems, album]);
	const { items: bSidesItems } = useInfiniteQuery(
		(releaseId) => releaseBSidesQuery(releaseId),
		releaseId,
	);
	const { data: externalMetadata } = useQuery(
		(albumId) => getAlbumExternalMetadata(albumId),
		album?.id,
	);
	const { items: videoItems } = useInfiniteQuery(
		(albumId) => releatedVideos(albumId),
		album?.id,
	);

	const { items: genres } = useInfiniteQuery(
		(albumId) => getGenres({ album: albumId }),
		album?.id,
	);
	const { bSides, extras: audioExtras } = useBSidesAndExtras(bSidesItems);
	const { videos, liveVideos, videoExtras } = useVideos(
		videoItems,
		album?.type,
		tracks,
	);
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
	return (
		<View style={styles.bottomSections}>
			<GenreRow genres={genres} style={styles.section} />
			<SongGrid
				hideIfEmpty
				style={styles.section}
				header={t("album.bonusTracks")}
				// Avoid shift when bsides are loaded before main artist
				songs={albumArtistId === undefined ? undefined : bSides}
				parentArtistId={albumArtistId ?? undefined}
				subtitle={
					!bSides
						? null
						: (song) =>
								song.artistId === albumArtistId &&
								song.featuring.length === 0
									? null
									: "artists"
				}
			/>

			<Row
				hideIfEmpty
				style={styles.section}
				header={t("album.otherAlbumReleases")}
				items={relatedReleases}
				render={(release) => <ReleaseTile release={release} />}
			/>
			{(
				[
					["musicVideos", videos],
					["livePerformances", liveVideos],
				] as const
			).map(([label, items]) => (
				<Row
					key={label}
					hideIfEmpty
					items={videoItems === undefined ? undefined : items}
					header={t(`browsing.sections.${label}`)}
					style={styles.section}
					render={(video) => (
						<VideoTile
							onPress={() =>
								video && onVideoPress(video.id, items)
							}
							illustrationProps={{
								normalizedThumbnail: true,
							}}
							video={video}
							subtitle="duration"
						/>
					)}
				/>
			))}
			{videoItems === undefined ||
				bSidesItems === undefined ||
				((videoExtras.length > 0 || audioExtras.length > 0) && (
					<View style={{ width: "100%" }}>
						<SectionHeader
							content={
								videoItems === undefined ||
								bSidesItems === undefined
									? undefined
									: t("browsing.sections.extras")
							}
							skeletonWidth={10}
						/>

						<Row
							hideIfEmpty
							items={
								videoItems === undefined
									? undefined
									: videoExtras
							}
							render={(video) => (
								<VideoTile
									onPress={() =>
										video &&
										onVideoPress(video.id, videoExtras)
									}
									illustrationProps={{
										normalizedThumbnail: true,
									}}
									video={video}
									subtitle="duration"
								/>
							)}
						/>
						<SongGrid
							hideIfEmpty
							subtitle={() => null}
							songs={
								bSidesItems === undefined
									? undefined
									: audioExtras
							}
						/>
					</View>
				))}

			<Row
				hideIfEmpty
				style={styles.section}
				header={t("album.relatedAlbums")}
				items={relatedAlbums}
				render={(album) => <AlbumTile album={album} subtitle="year" />}
			/>

			<Row
				hideIfEmpty
				style={styles.section}
				header={t("album.onThisAlbum")}
				items={
					// We don't want to list them until we know who the album artist is
					albumArtistId === undefined
						? undefined
						: featuringArtists?.filter(
								({ id }) => id !== albumArtistId,
							)
				}
				render={(artist) => <ArtistTile artist={artist} />}
			/>
			<Row
				hideIfEmpty
				style={styles.section}
				header={t("browsing.sections.featuredOnPlaylists")}
				items={relatedPlaylists}
				render={(playlist) => <PlaylistTile playlist={playlist} />}
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
		</View>
	);
};

const GenreRow = ({
	genres,
	style,
}: {
	genres: Genre[] | undefined;
	style?: ViewStyle;
}) => {
	const { t } = useTranslation();
	if (genres?.length === 0) {
		return null;
	}
	return (
		<ScrollView
			horizontal
			contentContainerStyle={styles.genreRow}
			style={style}
		>
			<Text content={`${t("models.genre_plural")}:`} variant="subtitle" />

			{(genres ?? generateArray(2)).map(
				(genre: Genre | undefined, idx) => (
					<Chip
						onPress={() => {}} // TODO Redirect to Genre page
						title={genre?.name}
						key={genre?.slug ?? idx}
					/>
				),
			)}
		</ScrollView>
	);
};

const styles = StyleSheet.create((theme) => ({
	section: {
		flex: 1,
		paddingBottom: theme.gap(2),
	},
	bottomSections: {
		flex: 1,
		alignItems: "flex-start",
	},
	genreRow: {
		gap: theme.gap(1.5),
		paddingHorizontal: theme.gap(2),
		alignItems: "center",
	},
}));
