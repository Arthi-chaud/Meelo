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
import { PrismaError } from "prisma-error-enum";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";
import type { PaginationParameters } from "src/pagination/models/pagination-parameters";
import { Prisma } from "src/prisma/generated/client";
import type { Provider } from "src/prisma/models";
import PrismaService from "src/prisma/prisma.service";
import {
	formatIdentifierToIdOrSlug,
	formatPaginationParameters,
} from "src/repository/repository.utils";
import Slug from "src/slug/slug";
import {
	ProviderAlreadyExistsException,
	ProviderNotFoundException,
} from "./external-metadata.exceptions";
import type ProviderQueryParameters from "./models/provider.query-parameters";

@Injectable()
export default class ProviderService {
	constructor(private prismaService: PrismaService) {}
	async create(providerName: string): Promise<Provider> {
		const providerSlug = new Slug(providerName);

		return this.prismaService.provider
			.create({
				data: {
					name: providerName,
					slug: providerSlug.toString(),
				},
			})
			.catch((error) => {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === PrismaError.UniqueConstraintViolation) {
						throw new ProviderAlreadyExistsException(providerSlug);
					}
				}
				throw new UnhandledORMErrorException(error, { providerName });
			});
	}

	static formatIdentifierToWhereInput = formatIdentifierToIdOrSlug;

	async get(where: ProviderQueryParameters.WhereInput) {
		return this.prismaService.provider
			.findFirstOrThrow({
				where: {
					slug: where.slug?.toString(),
					id: where.id,
				},
			})
			.catch((error) => {
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					error.code === PrismaError.RecordsNotFound
				) {
					throw new ProviderNotFoundException(
						where.id ?? where.slug!,
					);
				}
				throw new UnhandledORMErrorException(error, where);
			});
	}

	async getMany(paginationParameters: PaginationParameters) {
		return this.prismaService.provider.findMany({
			orderBy: { name: "asc" },
			...formatPaginationParameters(paginationParameters),
		});
	}
}
