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
import ExternalMetadataQueryParameters from "./models/external-metadata.query-parameters";
import PrismaService from "src/prisma/prisma.service";
import { Prisma } from "@prisma/client";
import { PrismaError } from "prisma-error-enum";
import {
	ExternalMetadataEntryExistsException,
	ExternalMetadataNotFoundException,
	ExternalMetadataResourceNotFoundException,
	MissingExternalMetadataResourceIdException,
} from "./external-metadata.exceptions";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";
import { ExternalMetadataResponse } from "./models/external-metadata.response";
import { CreateExternalMetadataDto } from "./models/external-metadata.dto";
import {
	ExternalMetadata,
	ExternalMetadataSource,
	Provider,
} from "src/prisma/models";
import ProviderService from "./provider.service";

@Injectable()
export default class ExternalMetadataService {
	constructor(
		private prismaService: PrismaService,
		protected providerService: ProviderService,
	) {}

	async saveMetadata(data: CreateExternalMetadataDto) {
		if (
			!data.albumId &&
			!data.artistId &&
			!data.songId &&
			!data.releaseId
		) {
			throw new MissingExternalMetadataResourceIdException(data);
		}
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
			.catch(async (error) => {
				if (error.code == PrismaError.RecordsNotFound) {
					await Promise.all(
						data.sources.map((s) =>
							this.providerService.get({ id: s.providerId }),
						),
					);
					throw new ExternalMetadataResourceNotFoundException(data);
				}
				if (error.code == PrismaError.UniqueConstraintViolation) {
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
				where: where,
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
					error.code == PrismaError.RecordsNotFound
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
