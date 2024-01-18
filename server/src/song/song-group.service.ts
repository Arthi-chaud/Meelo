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

import { Prisma } from "@prisma/client";
import { SongGroupWithRelations } from "src/prisma/models";
import RepositoryService from "src/repository/repository.service";
import SongGroupQueryParameters from "./models/song-group.query-params";
import { Inject, Injectable, forwardRef } from "@nestjs/common";
import SongService from "./song.service";
import { PrismaError } from "prisma-error-enum";
import {
	SongGroupAlreadyExistsException,
	SongGroupNotFoundByIdException,
	SongGroupNotFoundException,
} from "./song.exceptions";
import PrismaService from "src/prisma/prisma.service";
import Identifier from "src/identifier/models/identifier";
import Slug from "src/slug/slug";

@Injectable()
export default class SongGroupService extends RepositoryService<
	SongGroupWithRelations,
	SongGroupQueryParameters.CreateInput,
	SongGroupQueryParameters.WhereInput,
	SongGroupQueryParameters.ManyWhereInput,
	SongGroupQueryParameters.UpdateInput,
	SongGroupQueryParameters.DeleteInput,
	SongGroupQueryParameters.SortingKeys,
	Prisma.SongGroupCreateInput,
	Prisma.SongGroupWhereInput,
	Prisma.SongGroupWhereInput,
	Prisma.SongGroupUpdateInput,
	Prisma.SongGroupWhereUniqueInput,
	Prisma.SongGroupOrderByWithRelationAndSearchRelevanceInput
> {
	constructor(
		protected prismaService: PrismaService,
		@Inject(forwardRef(() => SongService))
		protected songService: SongService,
	) {
		super(prismaService, "songGroup");
	}
	getTableName() {
		return "song_versions";
	}
	formatCreateInput(input: SongGroupQueryParameters.CreateInput) {
		return {
			slug: input.slug.toString(),
		};
	}
	formatCreateInputToWhereInput(input: SongGroupQueryParameters.CreateInput) {
		return {
			slug: input.slug,
		};
	}
	protected onCreationFailure(
		error: Error,
		input: SongGroupQueryParameters.CreateInput,
	): Error | Promise<Error> {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.UniqueConstraintViolation
		) {
			return new SongGroupAlreadyExistsException(input.slug);
		}
		return this.onUnknownError(error, input);
	}

	static formatWhereInput(input: SongGroupQueryParameters.WhereInput) {
		return {
			id: input.id,
			slug: input.slug?.toString(),
			songs: input.song
				? {
						some: SongService.formatWhereInput(input.song),
				  }
				: undefined,
		};
	}
	formatWhereInput = SongGroupService.formatWhereInput;

	async onNotFound(
		error: Error,
		where: SongGroupQueryParameters.WhereInput,
	): Promise<Error> {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.RecordsNotFound
		) {
			if (where.song != undefined) {
				return this.songService.onNotFound(error, where.song);
			} else if (where.id !== undefined) {
				return new SongGroupNotFoundByIdException(where.id);
			}
			return new SongGroupNotFoundException(where.slug);
		}
		return this.onUnknownError(error, where);
	}

	static formatManyWhereInput(
		input: SongGroupQueryParameters.ManyWhereInput,
	) {
		return input;
	}

	formatManyWhereInput = SongGroupService.formatManyWhereInput;

	formatUpdateInput(what: SongGroupQueryParameters.UpdateInput) {
		return what;
	}

	formatDeleteInput(input: SongGroupQueryParameters.DeleteInput) {
		return {
			id: input.id,
		};
	}

	formatDeleteInputToWhereInput(input: SongGroupQueryParameters.DeleteInput) {
		return input;
	}

	formatSortingInput(input: SongGroupQueryParameters.SortingParameter) {
		switch (input.sortBy) {
			case "name":
				return { slug: input.order };
			case "id":
			case undefined:
				return { id: input.order };
		}
	}

	/**
	 * Call 'delete' method on all song groups that do not have any song
	 */
	async housekeeping(): Promise<void> {
		await this.prismaHandle.songGroup.deleteMany({
			where: {
				versions: {
					none: {},
				},
			},
		});
	}

	static formatIdentifierToWhereInput(identifier: Identifier) {
		return RepositoryService.formatIdentifier<SongGroupQueryParameters.WhereInput>(
			identifier,
			(id: string) => ({ slug: new Slug(id) }),
			(id: number) => ({ id: id }),
		);
	}
}
