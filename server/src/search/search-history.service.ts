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
import { Prisma } from "@prisma/client";
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

@Injectable()
export class SearchHistoryService {
	constructor(
		private prismaService: PrismaService,
		private artistService: ArtistService,
		private songService: SongService,
		private albumService: AlbumService,
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
			},
		});
		//TODO Check resource exists
		return this.prismaService.searchHistory
			.create({
				data: {
					userId,
					songId: dto.songId,
					albumId: dto.albumId,
					artistId: dto.artistId,
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
	): Promise<(Artist | Song | AlbumModel)[]> {
		const history = await this.prismaService.searchHistory.findMany({
			where: { userId },
			orderBy: { searchAt: "desc" },
			...formatPaginationParameters(paginationParameters),
		});
		const artists = await this.artistService.getMany(
			{
				id: {
					in: history
						.filter((item) => item.artistId !== null)
						.map(({ artistId }) => artistId!),
				},
			},
			undefined,
			undefined,
			{ illustration: true },
		);
		const songs = await this.songService.getMany(
			{
				id: {
					in: history
						.filter((item) => item.songId !== null)
						.map(({ songId }) => songId!),
				},
			},
			undefined,
			undefined,
			{ illustration: true, artist: true, master: true, featuring: true },
		);
		const albums = await this.albumService.getMany(
			{
				id: {
					in: history
						.filter((item) => item.albumId !== null)
						.map(({ albumId }) => albumId!),
				},
			},
			undefined,
			undefined,
			{ illustration: true, artist: true },
		);

		return [...artists, ...songs, ...albums].sort((a, b) => {
			const getIndex = (t: any) => {
				if (t["groupId"]) {
					return history.findIndex(({ songId }) => songId == t["id"]);
				}
				if (t["masterId"]) {
					return history.findIndex(
						({ albumId }) => albumId == t["id"],
					);
				}
				return history.findIndex(({ artistId }) => artistId == t["id"]);
			};
			return getIndex(a) - getIndex(b);
		});
	}
}