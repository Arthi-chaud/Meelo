import { FlashList } from "@shopify/flash-list";
import { useSetAtom } from "jotai";
import { type ComponentProps, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View, type ViewStyle } from "react-native";
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
import type Label from "@/models/label";
import type { ReleaseWithRelations } from "@/models/release";
import type { SongWithRelations } from "@/models/song";
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
import { useQueryErrorModal } from "~/hooks/error";
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

type ReleasePageSection =
	| {
			type: "header";
			props: ComponentProps<typeof Header>;
	  }
	| {
			type: "tracklist";
			props: ComponentProps<typeof Tracklist>;
	  }
	| {
			type: "genre-row";
			props: ComponentProps<typeof GenreRow>;
	  }
	| {
			type: "row";
			props: ComponentProps<typeof Row>;
	  }
	| {
			type: "song-grid";
			props: ComponentProps<typeof SongGrid>;
	  }
	| {
			type: "extra-section";
			props: ComponentProps<typeof ExtraSection>;
	  }
	| {
			type: "external-description";
			props: ComponentProps<typeof ExternalMetadataDescriptionSection>;
	  }
	| {
			type: "label-footer";
			props: ComponentProps<typeof RecordLabelSection>;
	  }
	| {
			type: "external-source";
			props: ComponentProps<typeof ExternalMetadataSourcesSection>;
	  };

const renderSection = (section: ReleasePageSection) => {
	switch (section.type) {
		case "header":
			return <Header {...section.props} />;
		case "tracklist":
			return <Tracklist {...section.props} />;
		case "genre-row":
			return <GenreRow {...section.props} />;
		case "row":
			return <Row {...section.props} />;
		case "label-footer":
			return <RecordLabelSection {...section.props} />;
		case "song-grid":
			return <SongGrid {...section.props} />;
		case "extra-section":
			return <ExtraSection {...section.props} />;
		case "external-source":
			return <ExternalMetadataSourcesSection {...section.props} />;
		case "external-description":
			return <ExternalMetadataDescriptionSection {...section.props} />;
	}
};

export default function ReleasePage({ releaseId }: { releaseId: string }) {
	const releaseQuery = useQuery(() =>
		getRelease(releaseId, ["illustration", "discs", "label"]),
	);
	const { data: release } = releaseQuery;

	const albumQuery = useQuery(
		(albumId) => getAlbum(albumId, ["artist"]),
		release?.albumId,
	);
	const { data: album } = albumQuery;
	const discsQuery = useQuery(() => releaseTracklistQuery(releaseId, false));
	const { data: discs } = discsQuery;
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
	const postSections = usePostTracklistSections({
		release,
		album: album,
		tracks: tracks_ ?? [],
		albumArtistId: album?.artistId,
	});
	const sections: ReleasePageSection[] = [
		{
			type: "header",
			props: {
				isMixed: isMixed,
				release: release,
				album: album,
				tracks: tracks,
				totalDuration: totalDuration,
			},
		},
		{
			type: "tracklist",
			props: {
				// Note: We wait for the album to be loaded to avoid a shift in the tracklist
				// if the song artist isn't the album's
				albumArtistId: album?.artistId,
				tracks: album ? tracks : undefined,
				tracklist: album ? (tracklist as any) : undefined, // TODO Avoid cast
				discs: album ? release?.discs : undefined,
			},
		},
		...postSections,
	];

	useQueryErrorModal([releaseQuery, albumQuery, discsQuery]);
	useSetKeyIllustration(release);
	return (
		<FlashList
			data={sections}
			getItemType={({ type }) => type}
			renderItem={({ item }) => renderSection(item)}
		/>
	);
}

const usePostTracklistSections = ({
	album,
	release,
	albumArtistId,
	tracks,
}: {
	album: Album | undefined;
	release: ReleaseWithRelations<"label"> | undefined;
	albumArtistId: number | undefined | null;
	tracks: TracklistItemWithRelations<"artist" | "featuring">[];
}): ReleasePageSection[] => {
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
		[playTracks],
	);
	const labelFooter: ReleasePageSection | null = useMemo(
		() =>
			release?.label
				? {
						type: "label-footer",
						props: {
							style: styles.section,
							label: release.label,
						},
					}
				: null,
		[release],
	);
	const genreRow: ReleasePageSection = useMemo(
		() => ({ type: "genre-row", props: { genres, style: styles.section } }),
		[genres],
	);
	const bonusTracks: ReleasePageSection = useMemo(
		() => ({
			type: "song-grid",
			props: {
				hideIfEmpty: true,
				style: styles.section,
				header: t("album.bonusTracks"),
				// Avoid shift when bsides are loaded before main artist
				songs: albumArtistId === undefined ? undefined : bSides,
				parentArtistId: albumArtistId ?? undefined,
				subtitle: !bSides
					? null
					: (song) =>
							song.artistId === albumArtistId &&
							song.featuring.length === 0
								? null
								: "artists",
			},
		}),
		[albumArtistId, bSides],
	);
	const releasesSection: ReleasePageSection = useMemo(
		() => ({
			type: "row",
			props: {
				hideIfEmpty: true,
				style: styles.section,
				header: t("album.otherAlbumReleases"),
				items: relatedReleases,
				render: (release) => <ReleaseTile release={release as any} />, // TODO avoid cast
			},
		}),
		[relatedReleases],
	);

	const videoSections: ReleasePageSection[] = useMemo(
		() =>
			(
				[
					["musicVideos", videos],
					["livePerformances", liveVideos],
				] as const
			).map(
				([label, items]) =>
					({
						type: "row",
						props: {
							hideIfEmpty: true,
							items: videoItems === undefined ? undefined : items,
							header: t(`browsing.sections.${label}`),
							style: styles.section,
							render: (video) => (
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
							),
						},
					}) satisfies ReleasePageSection,
			),
		[videos, videoItems, liveVideos],
	);

	const extraSection: ReleasePageSection | null = useMemo(() => {
		if (
			videoItems === undefined ||
			bSidesItems === undefined ||
			videoExtras.length > 0 ||
			audioExtras.length > 0
		) {
			return {
				type: "extra-section",
				props: {
					audioExtras: audioExtras,
					videoExtras: videoExtras,
					onVideoPress: (id: number) => onVideoPress(id, videoExtras),
				},
			};
		}
		return null;
	}, [videoItems, bSidesItems, videoExtras, audioExtras]);

	const relatedAlbumsSection: ReleasePageSection = useMemo(
		() => ({
			type: "row",
			props: {
				hideIfEmpty: true,
				style: styles.section,
				header: t("album.relatedAlbums"),
				items: relatedAlbums,
				render: (album) => (
					<AlbumTile album={album as any} subtitle="year" />
				),
			},
		}),
		[relatedAlbums],
	);
	const relatedArtistsSection: ReleasePageSection = useMemo(
		() => ({
			type: "row",
			props: {
				hideIfEmpty: true,
				style: styles.section,
				header: t("album.onThisAlbum"),
				items:
					// We don't want to list them until we know who the album artist is
					albumArtistId === undefined
						? undefined
						: featuringArtists?.filter(
								({ id }) => id !== albumArtistId,
							),
				render: (artist) => <ArtistTile artist={artist as any} />,
			},
		}),
		[albumArtistId, featuringArtists],
	);
	const playlistsSection: ReleasePageSection = useMemo(
		() => ({
			type: "row",
			props: {
				hideIfEmpty: true,
				style: styles.section,
				header: t("browsing.sections.featuredOnPlaylists"),
				items: relatedPlaylists,
				render: (playlist) => (
					<PlaylistTile playlist={playlist as any} />
				),
			},
		}),
		[relatedPlaylists],
	);
	const externalMetadataSections: ReleasePageSection[] = useMemo(() => {
		if (externalMetadata !== null) {
			return [
				{
					type: "external-description",
					props: {
						externalMetadata: externalMetadata,
						style: styles.section,
					},
				},

				{
					type: "external-source",
					props: {
						externalMetadata: externalMetadata,
						style: styles.section,
					},
				},
			];
		}
		return [];
	}, [externalMetadata]);

	return useMemo(
		() =>
			[
				labelFooter,
				genreRow,
				bonusTracks,
				releasesSection,
				...videoSections,
				extraSection,
				relatedAlbumsSection,
				relatedArtistsSection,
				playlistsSection,
				...externalMetadataSections,
			].filter((s): s is ReleasePageSection => s !== null),
		[
			labelFooter,
			genreRow,
			bonusTracks,
			releasesSection,
			videoSections,
			extraSection,
			relatedAlbumsSection,
			relatedArtistsSection,
			playlistsSection,
			externalMetadataSections,
		],
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

const RecordLabelSection = ({
	style,
	label,
}: {
	style: ViewStyle;
	label: Label;
}) => {
	const { t } = useTranslation();
	return (
		<View style={[style, styles.labelSection]}>
			<Text content={`${t("models.label")}:`} variant="subtitle" />
			<LabelChip label={label} />
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
		<FlashList
			horizontal
			contentContainerStyle={styles.genreRow}
			style={style}
			data={genres ?? generateArray(2)}
			CellRendererComponent={(props) => (
				<View {...props} style={[props.style, styles.genreChip]} />
			)}
			renderItem={({ item: genre }) => <GenreChip genre={genre} />}
			ListHeaderComponent={
				<Text
					content={`${t("models.genre_plural")}:`}
					variant="subtitle"
				/>
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
	genreRow: {
		paddingHorizontal: theme.gap(2),
		alignItems: "center",
	},
	genreChip: { paddingLeft: theme.gap(1) },
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
