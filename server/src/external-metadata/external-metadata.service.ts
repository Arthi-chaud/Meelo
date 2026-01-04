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
import { Prisma } from "src/prisma/generated/client";
import { PrismaError } from "prisma-error-enum";
import AlbumService from "src/album/album.service";
import ArtistService from "src/artist/artist.service";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";
import type {
	ExternalMetadata,
	ExternalMetadataSource,
	Provider,
} from "src/prisma/models";
import PrismaService from "src/prisma/prisma.service";
import ReleaseService from "src/release/release.service";
import SongService from "src/song/song.service";
import {
	DuplicateSourcesInExternalMetadataDto,
	ExternalMetadataEntryExistsException,
	ExternalMetadataNotFoundException,
	ExternalMetadataResourceNotFoundException,
	MissingExternalMetadataResourceIdException,
} from "./external-metadata.exceptions";
import type { CreateExternalMetadataDto } from "./models/external-metadata.dto";
import type ExternalMetadataQueryParameters from "./models/external-metadata.query-parameters";
import type { ExternalMetadataResponse } from "./models/external-metadata.response";
import ProviderService from "./provider.service";

@Injectable()
export default class ExternalMetadataService {
	constructor(
		private prismaService: PrismaService,
		protected providerService: ProviderService,
	) {}

	async saveMetadata(data: CreateExternalMetadataDto) {
		if (
			data.albumId === undefined &&
			data.artistId === undefined &&
			data.songId === undefined &&
			data.releaseId === undefined
		) {
			throw new MissingExternalMetadataResourceIdException(data);
		}
		data.sources
			.map((source) => source.providerId)
			.forEach((providerId, index, ids) => {
				if (ids.indexOf(providerId) !== index) {
					throw new DuplicateSourcesInExternalMetadataDto();
				}
			});
		// NOTE: No need to delete related sources, they will be cascade-deleted
		await this.prismaService.externalMetadata
			.deleteMany({
				where: {
					albumId: data.albumId ?? undefined,
					releaseId: data.releaseId ?? undefined,
					artistId: data.artistId ?? undefined,
					songId: data.songId ?? undefined,
				},
			})
			.catch(() => {});
		return this.prismaService.externalMetadata
			.create({
				data: {
					...data,
					sources: {
						createMany: {
							data: data.sources.map((source) => ({
								url: source.url,
								providerId: source.providerId,
							})),
						},
					},
				},
				include: { sources: { include: { provider: true } } },
			})
			.then((res) => this.formatResponse(res))
			.catch(async (error) => {
				if (error.code === PrismaError.RecordsNotFound) {
					await Promise.all(
						data.sources.map((s) =>
							this.providerService.get({ id: s.providerId }),
						),
					);
				}
				if (error.code === PrismaError.ForeignConstraintViolation) {
					throw new ExternalMetadataResourceNotFoundException(data);
				}
				if (error.code === PrismaError.UniqueConstraintViolation) {
					throw new ExternalMetadataEntryExistsException(data);
				}
				throw new UnhandledORMErrorException(error, data);
			});
	}

	async get(
		where: ExternalMetadataQueryParameters.WhereInput,
	): Promise<ExternalMetadataResponse> {
		return this.prismaService.externalMetadata
			.findFirstOrThrow({
				where: {
					album:
						where.album &&
						AlbumService.formatWhereInput(where.album),
					artist:
						where.artist &&
						ArtistService.formatWhereInput(where.artist),
					song:
						where.song && SongService.formatWhereInput(where.song),
					release:
						where.release &&
						ReleaseService.formatWhereInput(where.release),
				},
				include: {
					sources: {
						include: {
							provider: true,
						},
					},
				},
			})
			.then((entry) => this.formatResponse(entry))
			.catch((error) => {
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					error.code === PrismaError.RecordsNotFound
				) {
					throw new ExternalMetadataNotFoundException(where);
				}
				throw new UnhandledORMErrorException(error, where);
			});
	}

	private formatResponse(
		entry: ExternalMetadata & {
			sources: (ExternalMetadataSource & { provider: Provider })[];
		},
	) {
		return {
			songId: entry.songId ?? undefined,
			artistId: entry.artistId ?? undefined,
			albumId: entry.albumId ?? undefined,
			releaseId: entry.releaseId ?? undefined,
			description: entry.description,
			rating: entry.rating,
			sources: entry.sources.map((source) => ({
				url: source.url,
				providerName: source.provider.name,
				providerId: source.provider.id,
				providerIcon: source.provider.illustrationId
					? `/illustrations/${source.provider.illustrationId}`
					: null,
			})),
		};
	}
}
