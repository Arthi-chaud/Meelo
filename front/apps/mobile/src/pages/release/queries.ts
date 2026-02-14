import type API from "@/api";
import {
	getAlbums,
	getArtists,
	getReleases,
	getReleaseTracklist,
	getSongs,
	getVideos,
} from "@/api/queries";
import type Tracklist from "@/models/tracklist";
import type { TracklistItemWithRelations } from "@/models/tracklist";

export const releatedVideos = (albumId: number) =>
	getVideos({ album: albumId }, undefined, [
		"master",
		"illustration",
		"artist",
		"song",
	]);

export const relatedReleasesQuery = (albumId: number) =>
	getReleases({ album: albumId }, { sortBy: "releaseDate" }, [
		"illustration",
	]);

export const releaseBSidesQuery = (releaseId: number) =>
	getSongs({ bsides: releaseId }, { sortBy: "name" }, [
		"artist",
		"featuring",
		"master",
		"illustration",
	]);

export const relatedAlbumsQuery = (albumId: number) =>
	getAlbums({ related: albumId }, { sortBy: "releaseDate" }, [
		"artist",
		"illustration",
	]);

export const releaseTracklistQuery = (
	releaseIdentifier: number | string,
	exclusiveOnly: boolean,
) => {
	const query = getReleaseTracklist(releaseIdentifier, exclusiveOnly, [
		"artist",
		"featuring",
	]);
	return {
		key: query.key,
		exec: (api: API) => () =>
			query
				.exec(api)({ pageSize: 10000 })
				.then(({ items }) => {
					return items.reduce(
						(prev, item) => {
							const itemKey = item.discIndex ?? "?";
							return {
								...prev,
								[item.discIndex ?? "?"]: [
									...(prev[itemKey] ?? []),
									item,
								],
							};
						},
						{} as Tracklist<
							TracklistItemWithRelations<"artist" | "featuring">
						>,
					);
				}),
	};
};

export const artistsOnAlbumQuery = (albumId: number) => {
	const query = getArtists({ album: albumId }, undefined, ["illustration"]);

	return {
		key: query.key,
		exec: (api: API) => () =>
			query
				.exec(api)({ pageSize: 10000 })
				.then((res) => res.items),
	};
};
