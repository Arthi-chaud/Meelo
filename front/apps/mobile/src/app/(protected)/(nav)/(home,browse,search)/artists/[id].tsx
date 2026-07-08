import { useLocalSearchParams } from "expo-router";
import { useSetAtom } from "jotai";
import { type ComponentProps, Fragment, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
	getAlbums,
	getArtist,
	getArtistExternalMetadata,
	getParentAreas,
	getSongs,
	getVideos,
} from "@/api/queries";
import type { Query } from "@/api/query";
import {
	type AlbumSortingKey,
	AlbumType,
	type AlbumWithRelations,
} from "@/models/album";
import type { Area } from "@/models/area";
import { albumTypeToTranslationKey } from "@/models/utils";
import type { VideoSortingKey, VideoWithRelations } from "@/models/video";
import { VideoTypeIsExtra } from "@/models/video";
import { playTracksAtom } from "@/state/player";
import { useInfiniteQuery, useQueries, useQuery } from "~/api";
import { AreaButton } from "~/components/area-button";
import { useSetKeyIllustration } from "~/components/background-gradient";
import {
	ExternalMetadataDescriptionSection,
	ExternalMetadataSourcesSection,
} from "~/components/external-metadata";
import { FadingHeader } from "~/components/header";
import { AlbumTile } from "~/components/item/resource/album";
import { VideoTile } from "~/components/item/resource/video";
import { ArtistHeader } from "~/components/resource-header";
import { Row } from "~/components/row";
import { SafeFlashList } from "~/components/safe-view";
import { SongGrid } from "~/components/song-grid";
import { useQueryErrorModal } from "~/hooks/error";
import { Text } from "~/primitives/text";
import type { Sorting } from "~/utils/sorting";

const albumTypeQuery = (
	albumType: AlbumType,
	artistId: string,
): Query<AlbumWithRelations<"illustration" | "artists">[]> => {
	const { key, exec } = getAlbums(
		{ artist: artistId, type: [albumType] },
		{ sortBy: "releaseDate", order: "desc" },
		["illustration", "artists"],
	);
	return {
		key: [...key, "first-page"],
		exec: (api) => () => exec(api)({}).then(({ items }) => items),
	};
};

// Note: we show the 'seeMore' button for song grids and video rows iff there's more items than ShowSeeMoreThreshold
// since the user may want to shuffle them through the dedicated page

const ShowSeeMoreThreshold = 3;

type ArtistPageSection =
	| { type: "header"; props: ComponentProps<typeof ArtistHeader> }
	| { type: "songGrid"; props: ComponentProps<typeof SongGrid> }
	| {
			type: "albumRow";
			props: ComponentProps<
				typeof Row<AlbumWithRelations<"illustration" | "artists">>
			>;
	  }
	| {
			type: "videoRow";
			props: ComponentProps<
				typeof Row<
					VideoWithRelations<"illustration" | "artist" | "master">
				>
			>;
	  }
	| {
			type: "aboutSection";
			props: ComponentProps<typeof ExternalMetadataDescriptionSection>;
	  }
	| {
			type: "fromSection";
			props: ComponentProps<typeof AreaSection>;
	  }
	| {
			type: "externalLinks";
			props: ComponentProps<typeof ExternalMetadataSourcesSection>;
	  };

const AreaSection = ({ areas }: { areas: Area[] | null | undefined }) => {
	const { t } = useTranslation();
	if (!areas) {
		return null;
	}
	return (
		<View style={styles.areaSection}>
			<Text
				variant="itemLabel"
				style={[{ flex: 0 }, styles.areaText]}
				content={`${t("misc.from")} `}
			/>
			<View style={styles.areaListContainer}>
				{areas.map((area, index) => (
					<Fragment key={area.id}>
						<AreaButton
							area={area}
							textProps={{
								variant: "itemText",
								style: styles.areaText,
							}}
							containerProps={{ style: styles.areaButton }}
						/>

						{index < areas.length - 1 ? (
							<Text content=", " style={styles.areaText} />
						) : null}
					</Fragment>
				))}
			</View>
		</View>
	);
};

const renderSection = (section: ArtistPageSection) => {
	switch (section.type) {
		case "header":
			return <ArtistHeader {...section.props} />;
		case "songGrid":
			return <SongGrid {...section.props} />;
		case "albumRow":
			return <Row {...section.props} />;
		case "videoRow":
			return <Row {...section.props} />;
		case "aboutSection":
			return <ExternalMetadataDescriptionSection {...section.props} />;
		case "fromSection":
			return <AreaSection {...section.props} />;
		case "externalLinks":
			return <ExternalMetadataSourcesSection {...section.props} />;
	}
};

const filterSections = (sections: ArtistPageSection[]): ArtistPageSection[] => {
	return sections.filter((section) => {
		switch (section.type) {
			case "header":
				return true;
			case "songGrid":
				return section.props.songs?.length !== 0;
			case "albumRow":
				return section.props.items?.length !== 0;
			case "videoRow":
				return section.props.items?.length !== 0;
			case "aboutSection":
				return section.props.externalMetadata !== null;
			case "fromSection":
				return section.props.areas !== null;
			case "externalLinks":
				return section.props.externalMetadata?.sources.length !== 0;
		}
		return true;
	});
};

export default function ArtistView() {
	const playTracks = useSetAtom(playTracksAtom);
	const { id: artistId } = useLocalSearchParams<{ id: string }>();
	const { t } = useTranslation();

	const artistQuery = useQuery(() =>
		getArtist(artistId, ["illustration", "birthArea", "activityArea"]),
	);
	const { data: artist } = artistQuery;
	const area = artist ? (artist.birthArea ?? artist.activityArea) : undefined;
	const { data: parentAreas } = useQuery(getParentAreas, area?.id);
	const albumTypeQueries = useQueries(
		...AlbumType.map(
			(
				type,
			): Parameters<
				typeof useQuery<
					AlbumWithRelations<"illustration" | "artists">[],
					[]
				>
			> => [() => albumTypeQuery(type, artistId)],
		),
	);
	const areas = useMemo(() => {
		if (!area) {
			return area;
		}
		if (parentAreas === undefined) {
			return undefined;
		}
		return [area, ...parentAreas];
	}, [area, parentAreas]);
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
			["artists", "illustration"],
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
	const sections: ArtistPageSection[] = [
		{ type: "header", props: { artist } },
		{
			type: "songGrid",
			props: {
				header: t("artist.topSongs"),
				mainArtists: artist ? [artist] : undefined,
				hideIfEmpty: true,
				seeMore:
					(topSongs.items?.length ?? 0) >= ShowSeeMoreThreshold
						? {
								pathname: "/songs",
								params: { artist: artistId },
							}
						: undefined,
				songs: topSongs.data?.pages.at(0)?.items,
				subtitle: !topSongs.data
					? null
					: (song) =>
							song.artistId.toString() === artistId &&
							song.featuring.length === 0
								? null
								: "artists",
			},
		},
		...AlbumType.map((type, idx): ArtistPageSection => {
			const query = albumTypeQueries[idx];
			return {
				type: "albumRow",
				props: {
					hideIfEmpty: true,
					header: t(albumTypeToTranslationKey(type, true)),
					items: query.data,
					render: (item) => (
						<AlbumTile album={item} subtitle="year" />
					),
					seeMore:
						query.data && query.data.length >= 5
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
							: undefined,
				},
			};
		}),
		{
			type: "songGrid",
			props: {
				hideIfEmpty: true,
				header: t("artist.rareSongs"),
				seeMore:
					(rareSongs.items?.length ?? 0) > ShowSeeMoreThreshold
						? {
								pathname: "/songs",
								params: { rare: artistId },
							}
						: undefined,
				songs: rareSongs.data?.pages.at(0)?.items,
				mainArtists: artist ? [artist] : undefined,
				subtitle: !rareSongs.data
					? null
					: (song) =>
							song.artistId.toString() === artistId &&
							song.featuring.length === 0
								? null
								: "artists",
			},
		},
		...(
			[
				{ label: "musicVideos", items: musicVideos },
				{ label: "livePerformances", items: liveVideos },
				{ label: "extras", items: extras },
			] as const
		).map(
			({ label, items }): ArtistPageSection => ({
				type: "videoRow",
				props: {
					hideIfEmpty: true,
					items: items,
					header: t(`browsing.sections.${label}`),
					render: (item) => (
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
					),
					seeMore:
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
							: undefined,
				},
			}),
		),
		{
			type: "albumRow",
			props: {
				hideIfEmpty: true,
				header: t("artist.appearsOn"),
				items: relatedAlbums.items,
				render: (album) => (
					<AlbumTile album={album} subtitle="artistName" />
				),
			},
		},

		...((externalMetadata !== null
			? [
					{
						type: "aboutSection",
						props: {
							externalMetadata: externalMetadata,
						},
					},
				]
			: []) satisfies ArtistPageSection[]),
		{ type: "fromSection", props: { areas } },
		...((externalMetadata !== null
			? [
					{
						type: "externalLinks",
						props: {
							externalMetadata: externalMetadata,
						},
					},
				]
			: []) satisfies ArtistPageSection[]),
	];
	useSetKeyIllustration(artist ?? undefined);
	useQueryErrorModal([artistQuery]);
	return (
		<FadingHeader>
			{(props) => (
				<SafeFlashList
					{...props}
					ref={props.scrollRef}
					data={filterSections(sections)}
					getItemType={({ type }) => type}
					renderItem={({ item }) => (
						<View style={styles.section}>
							{renderSection(item)}
						</View>
					)}
				/>
			)}
		</FadingHeader>
	);
}

const styles = StyleSheet.create((theme) => ({
	section: { paddingBottom: theme.gap(2) },
	areaSection: {
		flexDirection: "row",
		alignItems: "flex-start",
		paddingHorizontal: theme.gap(2),
	},
	areaText: { lineHeight: theme.fontSize.rem(1.3) }, // NOTE: Copied from text component, for consistency across font
	areaListContainer: {
		flex: 1,
		flexWrap: "wrap",
		flexDirection: "row",
		justifyContent: "flex-start",
	},
	areaButton: {
		// NOTE: Overriding Pressable's padding
		paddingHorizontal: 0,
	},
}));
