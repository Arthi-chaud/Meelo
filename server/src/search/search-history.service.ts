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
import PrismaService from "src/prisma/prisma.service";
import { Prisma, Video } from "@prisma/client";
import { CreateSearchHistoryEntry } from "./models/create-search-history-entry.dto";
import {
	HistoryEntryResourceNotFoundException,
	InvalidCreateHistoryEntryException,
} from "./search.exceptions";
import { PrismaError } from "prisma-error-enum/dist";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import { formatPaginationParameters } from "src/repository/repository.utils";
import { AlbumModel } from "src/album/models/album.model";
import AlbumService from "src/album/album.service";
import ArtistService from "src/artist/artist.service";
import SongService from "src/song/song.service";
import { Artist, Song } from "src/prisma/models";
import VideoService from "src/video/video.service";
import { getSearchResourceType } from "./search.utils";

@Injectable()
export class SearchHistoryService {
	constructor(
		private prismaService: PrismaService,
		private artistService: ArtistService,
		private songService: SongService,
		private albumService: AlbumService,
		private videoService: VideoService,
	) {}

	async createEntry(
		dto: CreateSearchHistoryEntry,
		userId: number,
	): Promise<void> {
		if (Object.entries(dto).length != 1) {
			throw new InvalidCreateHistoryEntryException(dto);
		}
		await this.prismaService.searchHistory.deleteMany({
			where: {
				userId,
				songId: dto.songId,
				albumId: dto.albumId,
				artistId: dto.artistId,
				videoId: dto.videoId,
			},
		});
		return this.prismaService.searchHistory
			.create({
				data: {
					userId,
					songId: dto.songId,
					albumId: dto.albumId,
					artistId: dto.artistId,
					videoId: dto.videoId,
				},
			})
			.catch((error) => {
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					error.code == PrismaError.ForeignConstraintViolation
				) {
					throw new HistoryEntryResourceNotFoundException();
				}
				throw new UnhandledORMErrorException(error, dto);
			})
			.then(() => {});
	}

	async getHistory(
		userId: number,
		paginationParameters?: PaginationParameters,
	): Promise<(Artist | Song | AlbumModel | Video)[]> {
		const history = await this.prismaService.searchHistory.findMany({
			where: { userId },
			orderBy: { searchAt: "desc" },
			...formatPaginationParameters(paginationParameters),
		});
		const artists = await this.artistService.getMany(
			{
				artists: history
					.filter((item) => item.artistId !== null)
					.map(({ artistId }) => ({
						id: artistId!,
					})),
			},
			undefined,
			undefined,
			{ illustration: true },
		);
		const songs = await this.songService.getMany(
			{
				songs: history
					.filter((item) => item.songId !== null)
					.map(({ songId }) => ({ id: songId! })),
			},
			undefined,
			undefined,
			{ illustration: true, artist: true, master: true, featuring: true },
		);

		const videos = await this.videoService.getMany(
			{
				videos: history
					.filter((item) => item.videoId !== null)
					.map(({ videoId }) => ({ id: videoId! })),
			},
			undefined,
			{ illustration: true, artist: true, master: true },
			undefined,
		);
		const albums = await this.albumService.getMany(
			{
				albums: history
					.filter((item) => item.albumId !== null)
					.map(({ albumId }) => ({ id: albumId! })),
			},
			undefined,
			undefined,
			{ illustration: true, artist: true },
		);

		return [...artists, ...songs, ...albums, ...videos].sort((a, b) => {
			const getIndex = (item: any) => {
				switch (getSearchResourceType(item)) {
					case "video":
						return history.findIndex(
							({ videoId }) => videoId == item.id,
						);
					case "album":
						return history.findIndex(
							({ albumId }) => albumId == item.id,
						);
					case "song":
						return history.findIndex(
							({ songId }) => songId == item.id,
						);
					case "artist":
						return history.findIndex(
							({ artistId }) => artistId == item.id,
						);
				}
			};
			return getIndex(a) - getIndex(b);
		});
	}
}
