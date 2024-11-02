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
import { CreateSearchHistoryEntry } from "./models/create-search-history-entry.dto";
import {
	HistoryEntryResourceNotFoundException,
	InvalidCreateHistoryEntryException,
} from "./search.exceptions";
import { Prisma } from "node_modules/@prisma/client/default";
import { PrismaError } from "node_modules/prisma-error-enum/dist";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";

@Injectable()
export class SearchHistoryService {
	constructor(private prismaService: PrismaService) {}

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
}
