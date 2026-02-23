import { FlashList } from "@shopify/flash-list";
import { useSetAtom } from "jotai";
import { type ComponentProps, type JSX, useCallback, useMemo } from "react";
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

export type FooterSection =
	| { type: "footer-top-padding"; props: ComponentProps<typeof View> }
	| {
			type: "chip-row";
			props: ComponentProps<typeof ChipRow>;
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
			type: "external-source";
			props: ComponentProps<typeof ExternalMetadataSourcesSection>;
	  };

export const renderFooterSection = ({ type, props }: FooterSection) => {
	switch (type) {
		case "footer-top-padding":
			return <View {...props} />;
		case "chip-row":
			return <ChipRow {...props} />;
		case "row":
			return <Row {...props} />;
		case "song-grid":
			return <SongGrid {...props} />;
		case "extra-section":
			return <ExtraSection {...props} />;
		case "external-source":
			return <ExternalMetadataSourcesSection {...props} />;
		case "external-description":
			return <ExternalMetadataDescriptionSection {...props} />;
	}
};

export const useFooter = ({
	album,
	release,
	albumArtistId,
	tracks,
}: {
	album: Album | undefined;
	release: ReleaseWithRelations<"label"> | undefined;
	albumArtistId: number | undefined | null;
	tracks: TrackType[];
}): FooterSection[] => {
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

	const labelsRow: FooterSection | null = useMemo(() => {
		if (labels?.length !== 0) {
			return {
				type: "chip-row",
				props: {
					items: labels,
					style: styles.section,
					title: "models.label",
					renderItem: (label) => <LabelChip label={label as Label} />,
				},
			};
		}
		return null;
	}, [genres]);
	const genreRow: FooterSection | null = useMemo(() => {
		if (genres?.length !== 0) {
			return {
				type: "chip-row",
				props: {
					items: genres,
					style: styles.section,
					title: "models.genre_plural",
					renderItem: (genre) => <GenreChip genre={genre as Genre} />,
				},
			};
		}
		return null;
	}, [genres]);
	const bonusTracks: FooterSection = useMemo(
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
	const releasesSection: FooterSection = useMemo(
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

	const videoSections: FooterSection[] = useMemo(
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
					}) satisfies FooterSection,
			),
		[videos, videoItems, liveVideos],
	);

	const extraSection: FooterSection | null = useMemo(() => {
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

	const relatedAlbumsSection: FooterSection = useMemo(
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
	const relatedArtistsSection: FooterSection = useMemo(
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
	const playlistsSection: FooterSection = useMemo(
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
	const externalMetadataSections: FooterSection[] = useMemo(() => {
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
				{
					type: "footer-top-padding",
					props: { style: styles.footerTopPadding },
				},
				labelsRow,
				genreRow,
				bonusTracks,
				releasesSection,
				...videoSections,
				extraSection,
				relatedAlbumsSection,
				relatedArtistsSection,
				playlistsSection,
				...externalMetadataSections,
			].filter((s): s is FooterSection => s !== null),
		[
			labelsRow,
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
	footerTopPadding: { paddingTop: theme.gap(2) },
}));
