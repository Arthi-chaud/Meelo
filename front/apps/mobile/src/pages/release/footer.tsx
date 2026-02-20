import { FlashList } from "@shopify/flash-list";
import { useSetAtom } from "jotai";
import { type JSX, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, View, type ViewStyle } from "react-native";
import type { ViewProps } from "react-native-svg/lib/typescript/fabric/utils";
import { StyleSheet } from "react-native-unistyles";
import {
	getAlbumExternalMetadata,
	getGenres,
	getLabels,
	getPlaylists,
} from "@/api/queries";
import type Album from "@/models/album";
import type Genre from "@/models/genre";
import type Label from "@/models/label";
import type { ReleaseWithRelations } from "@/models/release";
import type { SongWithRelations } from "@/models/song";
import type { VideoWithRelations } from "@/models/video";
import { playTracksAtom } from "@/state/player";
import { useBSidesAndExtras, useLabels, useVideos } from "@/ui/pages/release";
import { generateArray } from "@/utils/gen-list";
import { useInfiniteQuery, useQuery } from "~/api";
import {
	ExternalMetadataDescriptionSection,
	ExternalMetadataSourcesSection,
} from "~/components/external-metadata";
import { AlbumTile } from "~/components/item/resource/album";
import { ArtistTile } from "~/components/item/resource/artist";
import { GenreChip } from "~/components/item/resource/genre";
import { LabelChip } from "~/components/item/resource/label";
import { PlaylistTile } from "~/components/item/resource/playlist";
import ReleaseTile from "~/components/item/resource/release";
import { VideoTile } from "~/components/item/resource/video";
import { Row } from "~/components/row";
import { SectionHeader } from "~/components/section-header";
import { SongGrid } from "~/components/song-grid";
import { Text } from "~/primitives/text";
import {
	artistsOnAlbumQuery,
	relatedAlbumsQuery,
	relatedReleasesQuery,
	releaseBSidesQuery,
	releatedVideos,
} from "./queries";
import type { TrackType } from "./tracklist";

export const Footer = ({
	album,
	release,
	albumArtistId,
	tracks,
}: {
	album: Album | undefined;
	release: ReleaseWithRelations<"label"> | undefined;
	albumArtistId: number | undefined | null;
	tracks: TrackType[];
}) => {
	const releaseId = release?.id;
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

	const { items: albumLabels } = useInfiniteQuery(
		(albumId) => getLabels({ album: albumId }),
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
	const labels = useLabels(release, albumLabels);
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
		[playTracks],
	);
	return (
		<View>
			<LabelRow labels={labels} style={styles.section} />
			<GenreRow genres={genres} style={styles.section} />
			<SongGrid
				hideIfEmpty={true}
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
					hideIfEmpty={true}
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
							video={video as any}
							subtitle="duration"
						/>
					)}
				/>
			))}

			{(videoItems === undefined ||
				bSidesItems === undefined ||
				videoExtras.length > 0 ||
				audioExtras.length > 0) && (
				<ExtraSection
					audioExtras={audioExtras}
					videoExtras={videoExtras}
					onVideoPress={(id: number) => onVideoPress(id, videoExtras)}
				/>
			)}
			<Row
				hideIfEmpty
				style={styles.section}
				header={t("album.relatedAlbums")}
				items={relatedAlbums}
				render={(album) => (
					<AlbumTile album={album as any} subtitle="year" />
				)}
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

type ExtraSectionProps = {
	videoExtras:
		| VideoWithRelations<"illustration" | "master" | "artist">[]
		| undefined;
	onVideoPress: (id: number) => void;
	audioExtras:
		| SongWithRelations<
				"illustration" | "master" | "artist" | "featuring"
		  >[]
		| undefined;
};

const ExtraSection = ({
	videoExtras,
	onVideoPress,
	audioExtras,
}: ExtraSectionProps) => {
	const { t } = useTranslation();
	return (
		<View style={styles.extraSection}>
			<SectionHeader
				content={
					videoExtras === undefined && audioExtras === undefined
						? undefined
						: t("browsing.sections.extras")
				}
				skeletonWidth={10}
			/>

			<Row
				hideIfEmpty
				items={videoExtras}
				render={(video) => (
					<VideoTile
						onPress={() => video && onVideoPress(video.id)}
						illustrationProps={{
							normalizedThumbnail: true,
						}}
						video={video}
						subtitle="duration"
					/>
				)}
			/>
			<SongGrid hideIfEmpty subtitle={() => null} songs={audioExtras} />
		</View>
	);
};

const LabelRow = ({
	style,
	labels,
}: {
	style: ViewStyle;
	labels: Label[] | undefined;
}) => {
	if (labels?.length === 0) {
		return null;
	}
	return (
		<ChipRow
			items={labels}
			style={style}
			title="models.label"
			renderItem={(label) => <LabelChip label={label} />}
		/>
	);
};

const GenreRow = ({
	genres,
	style,
}: {
	genres: Genre[] | undefined;
	style?: ViewStyle;
}) => {
	return (
		<ChipRow
			items={genres}
			style={style}
			title="models.genre_plural"
			renderItem={(genre) => <GenreChip genre={genre} />}
		/>
	);
};

const ChipRow = <T,>({
	items,
	style,
	title,
	renderItem,
}: {
	items: T[] | undefined;
	style?: ViewStyle;
	title: TranslationKey;
	renderItem: (item: T | undefined) => JSX.Element;
}) => {
	const { t } = useTranslation();
	if (items?.length === 0) {
		return null;
	}

	// Solution to #1406
	const FList = items?.length === 1 ? FlatList : FlashList;
	return (
		<FList
			horizontal
			contentContainerStyle={styles.chipRow}
			style={style}
			data={items ?? generateArray(1)}
			CellRendererComponent={(props: ViewProps) => (
				<View {...props} style={[props.style, styles.chip]} />
			)}
			renderItem={({ item }) => renderItem(item)}
			ListHeaderComponent={
				<Text content={`${t(title)}:`} variant="subtitle" />
			}
		/>
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
	chipRow: {
		paddingHorizontal: theme.gap(2),
		alignItems: "center",
	},
	chip: { paddingLeft: theme.gap(1) },
	extraSection: { width: "100%" },
	labelSection: {
		flexDirection: "row",
		alignItems: "center",
		gap: theme.gap(1),
		paddingHorizontal: theme.gap(2),
		paddingBottom: theme.gap(2.5),
	},
	labelText: {
		textDecorationLine: "underline",
	},
}));
