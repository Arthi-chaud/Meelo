/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Injectable } from "@nestjs/common";
import type { Video } from "@prisma/client";
import type MeiliSearch from "meilisearch";
import { InjectMeiliSearch } from "nestjs-meilisearch";
import AlbumService from "src/album/album.service";
import type { AlbumModel } from "src/album/models/album.model";
import ArtistService from "src/artist/artist.service";
import type { Artist, Song } from "src/prisma/models";
import SongService from "src/song/song.service";
import VideoService from "src/video/video.service";

type MeilisearchResultType = Record<"id" | "_rankingScore", number>;

@Injectable()
export class SearchService {
	constructor(
		private artistService: ArtistService,
		private songService: SongService,
		private albumService: AlbumService,
		private videoService: VideoService,
		@InjectMeiliSearch() protected readonly meiliSearch: MeiliSearch,
	) {}

	async search(
		query: string,
	): Promise<(Artist | Song | AlbumModel | Video)[]> {
		const meiliQueryResult = await this.meiliSearch.multiSearch({
			queries: [
				this.artistService,
				this.songService,
				this.albumService,
				this.videoService,
			].map((s) => ({
				q: query,
				indexUid: s.indexName,
				showRankingScore: true,
				limit: 10,
			})),
		});
		const matchingArtistsIds = meiliQueryResult.results[0]
			.hits as MeilisearchResultType[];
		const matchingSongsIds = meiliQueryResult.results[1]
			.hits as MeilisearchResultType[];
		const matchingAlbumsIds = meiliQueryResult.results[2]
			.hits as MeilisearchResultType[];
		const matchingVideosIds = meiliQueryResult.results[3]
			.hits as MeilisearchResultType[];
		const [artists, songs, albums, videos] = await Promise.all(
			[
				[
					// Note: I know it's ugly, but needed for correct typing
					(ids: number[]) =>
						this.artistService.getMany(
							{ artists: ids.map((id) => ({ id })) },
							undefined,
							undefined,
							{ illustration: true },
						),
					matchingArtistsIds,
				] as const,
				[
					(ids: number[]) =>
						this.songService.getMany(
							{ songs: ids.map((id) => ({ id })) },
							undefined,
							undefined,
							{
								illustration: true,
								master: true,
								artist: true,
								featuring: true,
							},
						),
					matchingSongsIds,
				] as const,
				[
					(ids: number[]) =>
						this.albumService.getMany(
							{ albums: ids.map((id) => ({ id })) },
							undefined,
							undefined,
							{
								illustration: true,
								artist: true,
							},
						),
					matchingAlbumsIds,
				] as const,
				[
					(ids: number[]) =>
						this.videoService.getMany(
							{ videos: ids.map((id) => ({ id })) },
							undefined,
							{
								illustration: true,
								master: true,
								artist: true,
							},
						),
					matchingVideosIds,
				] as const,
			].map(async ([getMany, matches]) => {
				if (!matches.length) {
					return [];
				}
				const fullItems = await getMany(matches.map(({ id }) => id));

				return fullItems.map((item) => ({
					...item,
					ranking:
						matches.find((m) => m.id === item.id)?._rankingScore ??
						0,
				}));
			}),
		);

		return [...artists, ...songs, ...albums, ...videos].sort(
			(a, b) => b.ranking - a.ranking,
		);
	}
}
