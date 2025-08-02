import type Album from "@/models/album";
import type { AlbumType } from "@/models/album";
import type { Disc } from "@/models/disc";
import type Release from "@/models/release";
import type { SongWithRelations } from "@/models/song";
import type Tracklist from "@/models/tracklist";
import type { TracklistItemWithRelations } from "@/models/tracklist";
import { VideoTypeIsExtra, type VideoWithRelations } from "@/models/video";
import { getDate } from "@/utils/date";
import { useMemo } from "react";

type SongType = SongWithRelations<
	"artist" | "featuring" | "master" | "illustration"
>;

// From the query that returns the b sides for a release
// Split them depending on whether they are actual songs or bonus material
export const useBSidesAndExtras = (bSides: SongType[] | undefined) => {
	return useMemo(() => {
		return (bSides ?? []).reduce(
			(prev, current) => {
				if (["NonMusic", "Medley"].includes(current.type)) {
					return {
						bSides: prev.bSides,
						extras: prev.extras.concat(current),
					};
				}
				return {
					bSides: prev.bSides.concat(current),
					extras: prev.extras,
				};
			},
			{ bSides: [], extras: [] } as Record<
				"bSides" | "extras",
				SongType[]
			>,
		);
	}, [bSides]);
};

type TrackType = TracklistItemWithRelations<"artist" | "featuring">;

export const useTracklist = (
	tracklist: Tracklist<TrackType> | undefined,
): {
	isMixed: boolean | undefined;
	tracks: TrackType[];
	totalDuration: number | undefined;
	tracklist: Tracklist<TrackType> | undefined;
} => {
	return useMemo(() => {
		if (tracklist) {
			const discMap = tracklist;
			const flatTracks = Array.from(Object.values(discMap)).flat();

			return {
				isMixed: !flatTracks.some(({ mixed }) => !mixed),
				tracks: flatTracks,
				totalDuration: flatTracks.reduce(
					(prevDuration, track) =>
						prevDuration + (track.duration ?? 0),
					0,
				),
				tracklist: discMap,
			};
		}
		return {
			isMixed: undefined,
			tracks: [],
			totalDuration: undefined,
			tracklist: undefined,
		};
	}, [tracklist]);
};

type VideoType = VideoWithRelations<
	"master" | "illustration" | "song" | "artist"
>;

// Splits the videos depending on their type and sorts them based on the tracklist.
export const useVideos = (
	albumVideos: VideoType[] | undefined,
	albumType: AlbumType | undefined,
	tracks: TrackType[],
): {
	videos: VideoType[];
	liveVideos: VideoType[];
	videoExtras: VideoType[];
} => {
	return useMemo(
		() =>
			(albumVideos ?? [])
				.map((video) => {
					const videoIndex = tracks.findIndex(
						(track) =>
							(track.song ?? track.video)!.groupId ===
							video.groupId,
					);
					return [
						video,
						videoIndex === -1 ? tracks.length : videoIndex,
					] as const;
				})

				.sort(
					([v1, i1], [v2, i2]) =>
						i1 - i2 || v1.slug.localeCompare(v2.slug),
				)
				.map(([video, tracklistIndex], _, videosWithIndexes) => {
					if (albumType === "Single") {
						return [video, tracklistIndex] as const;
					}
					const firstVideoOfSameGroup = videosWithIndexes.find(
						([__, i]) => i === tracklistIndex,
					)!;
					return [
						video,
						firstVideoOfSameGroup[0].id === video.id
							? tracklistIndex
							: 10000 + tracklistIndex,
					] as const;
				})
				.sort(([_, i1], [__, i2]) => i1 - i2)
				.map(([v, _]) => v)
				.reduce(
					(prev, current) => {
						if (VideoTypeIsExtra(current.type)) {
							return {
								videos: prev.videos,
								liveVideos: prev.liveVideos,
								videoExtras: prev.videoExtras.concat(current),
							};
						}
						if (current.type === "Live") {
							return {
								videos: prev.videos,
								liveVideos: prev.liveVideos.concat(current),
								videoExtras: prev.videoExtras,
							};
						}
						return {
							videos: prev.videos.concat(current),
							liveVideos: prev.liveVideos,
							videoExtras: prev.videoExtras,
						};
					},
					{
						videos: [],
						videoExtras: [],
						liveVideos: [],
					} as Record<
						"videos" | "videoExtras" | "liveVideos",
						VideoType[]
					>,
				),
		[albumVideos, tracks],
	);
};

// Selects the most relevant date to display
export const useReleaseDate = (
	release: Release | undefined,
	album: Album | undefined,
) => {
	return useMemo(() => {
		if (!album || !release) {
			return undefined;
		}
		const albumDate = getDate(album.releaseDate);
		const releaseReleaseDate = getDate(release.releaseDate);
		if (releaseReleaseDate) {
			if (
				releaseReleaseDate.getMonth() === 0 &&
				releaseReleaseDate.getDate() === 1 &&
				albumDate &&
				releaseReleaseDate.getFullYear() === albumDate.getFullYear()
			) {
				return albumDate;
			}
			return releaseReleaseDate;
		}
		return albumDate;
	}, [release, album]);
};

export const formatDiscName = (
	discIndex: string,
	discs: Disc[] | undefined,
	//@ts-ignore
	t: (s: TranslationKey) => string,
) => {
	const disc = discs?.find((d) =>
		d.index === null ? discIndex === "?" : d.index.toString() === discIndex,
	);
	const base = `${t("models.disc")} ${discIndex}`;
	if (disc?.name) {
		return `${base} — ${disc.name}`;
	}
	return base;
};

// Formats the release date, ising locale
// for example: Aug 1996
export const formatReleaseDate = (date: Date, lang: string) => {
	if (date.getDate() === 1 && date.getMonth() === 0) {
		return date.getFullYear().toString();
	}
	const res = Intl.DateTimeFormat(lang, {
		month: "short",
		year: "numeric",
		localeMatcher: "best fit",
	}).format(date);

	return res[0].toUpperCase() + res.slice(1);
};
