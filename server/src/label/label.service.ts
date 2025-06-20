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
import { Prisma } from "@prisma/client";
import { PrismaError } from "prisma-error-enum";
import AlbumService from "src/album/album.service";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";
import Logger from "src/logger/logger";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import PrismaService from "src/prisma/prisma.service";
import ReleaseService from "src/release/release.service";
import {
	formatIdentifierToIdOrSlug,
	formatPaginationParameters,
} from "src/repository/repository.utils";
import Slug from "src/slug/slug";
import {
	LabelAlreadyExistsException,
	LabelNotFoundException,
} from "./label.exceptions";
import LabelQueryParameters from "./label.query-parameters";

@Injectable()
export default class LabelService {
	private readonly logger: Logger = new Logger(LabelService.name);
	constructor(private prismaService: PrismaService) {}

	async create(input: LabelQueryParameters.CreateInput) {
		const labelSlug = new Slug(input.name);
		return this.prismaService.label
			.create({
				data: {
					name: input.name,
					slug: labelSlug.toString(),
				},
			})
			.catch((error) => {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === PrismaError.UniqueConstraintViolation) {
						throw new LabelAlreadyExistsException(labelSlug);
					}
				}
				throw new UnhandledORMErrorException(error, input);
			});
	}

	async get(where: LabelQueryParameters.WhereInput) {
		return this.prismaService.label
			.findUniqueOrThrow({
				where: LabelService.formatWhereInput(where),
			})
			.catch((error) => {
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					error.code === PrismaError.RecordsNotFound
				) {
					if (where.id !== undefined) {
						throw new LabelNotFoundException(where.id);
					}
					throw new LabelNotFoundException(where.slug);
				}
				throw new UnhandledORMErrorException(error, where);
			});
	}

	async getMany(
		where: LabelQueryParameters.ManyWhereInput,
		sort?: LabelQueryParameters.SortingParameter,
		pagination?: PaginationParameters,
	) {
		return this.prismaService.label.findMany({
			where: LabelService.formatManyWhereInput(where),
			orderBy:
				sort === undefined ? undefined : this.formatSortingInput(sort),
			...formatPaginationParameters(pagination),
		});
	}

	static formatWhereInput(
		where: LabelQueryParameters.WhereInput,
	): Prisma.LabelWhereUniqueInput {
		return {
			id: where.id,
			slug: where.slug?.toString(),
		};
	}

	static formatManyWhereInput(
		where: LabelQueryParameters.ManyWhereInput,
	): Prisma.LabelWhereInput {
		const query: Prisma.LabelWhereInput[] = [];

		if (where.album?.not) {
			query.push({
				AND: [
					{
						releases: {
							none: ReleaseService.formatManyWhereInput({
								album: { is: where.album.not },
							}),
						},
					},
				],
			});
		} else if (where.album?.and) {
			query.push({
				AND: where.album.and.map((artist) => ({
					releases: {
						some: ReleaseService.formatManyWhereInput({
							album: { is: artist },
						}),
					},
				})),
			});
		} else if (where.album) {
			query.push({
				AND: [
					{
						releases: {
							some: ReleaseService.formatManyWhereInput({
								album: where.album,
							}),
						},
					},
				],
			});
		}
		if (where.artist?.not) {
			query.push({
				AND: [
					{
						releases: {
							none: {
								album: AlbumService.formatManyWhereInput({
									artist: { is: where.artist.not },
								}),
							},
						},
					},
				],
			});
		} else if (where.artist?.and) {
			query.push({
				AND: where.artist.and.map((artist) => ({
					releases: {
						some: {
							album: AlbumService.formatManyWhereInput({
								artist: { is: artist },
							}),
						},
					},
				})),
			});
		} else if (where.artist) {
			query.push({
				AND: [
					{
						releases: {
							some: {
								album: AlbumService.formatManyWhereInput({
									artist: where.artist,
								}),
							},
						},
					},
				],
			});
		}
		return { AND: query };
	}

	formatSortingInput(
		sortingParameter: LabelQueryParameters.SortingParameter,
	): Prisma.LabelOrderByWithRelationInput[] {
		sortingParameter.order ??= "asc";
		switch (sortingParameter.sortBy) {
			case "name":
				return [{ slug: sortingParameter.order }];
			case "releaseCount":
				return [{ releases: { _count: sortingParameter.order } }];
			default:
				return [
					{
						[sortingParameter.sortBy ?? "id"]:
							sortingParameter.order,
					},
				];
		}
	}

	static formatIdentifierToWhereInput = formatIdentifierToIdOrSlug;

	async getOrCreate(data: LabelQueryParameters.CreateInput) {
		const labelSlug = new Slug(data.name);
		return this.prismaService.label.upsert({
			where: { slug: labelSlug.toString() },
			create: { name: data.name, slug: labelSlug.toString() },
			update: {},
		});
	}

	async housekeeping() {
		const { count: deletedCount } =
			await this.prismaService.label.deleteMany({
				where: { releases: { none: {} } },
			});

		if (deletedCount) {
			this.logger.warn(`Deleted ${deletedCount} labels`);
		}
	}
}
