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

import { Body, Controller, Delete, Get, Query } from "@nestjs/common";
import { ApiOperation, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import AlbumService from "src/album/album.service";
import type AlbumQueryParameters from "src/album/models/album.query-parameters";
import { Role } from "src/authentication/roles/roles.decorators";
import Roles from "src/authentication/roles/roles.enum";
import { HousekeepingService } from "src/housekeeping/housekeeping.service";
import IdentifierParam from "src/identifier/identifier.pipe";
import TransformIdentifier from "src/identifier/identifier.transform";
import LibraryService from "src/library/library.service";
import type LibraryQueryParameters from "src/library/models/library.query-parameters";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import { File } from "src/prisma/models";
import { RegistrationService } from "src/registration/registration.service";
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
import type ReleaseQueryParameters from "src/release/models/release.query-parameters";
import ReleaseService from "src/release/release.service";
import Response, { ResponseType } from "src/response/response.decorator";
import type SongQueryParameters from "src/song/models/song.query-params";
import SongService from "src/song/song.service";
import type TrackQueryParameters from "src/track/models/track.query-parameters";
import TrackService from "src/track/track.service";
import FileService from "./file.service";
import FileQueryParameters from "./models/file.query-parameters";
import FileDeletionDto from "./models/file-deletion.dto";

class Selector {
	@IsOptional()
	@ApiPropertyOptional({
		description:
			"Filter files by folder. The folder is relative to the parent library",
	})
	inFolder?: string;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter files by library",
	})
	@TransformIdentifier(LibraryService)
	library?: LibraryQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter files by album",
	})
	@TransformIdentifier(AlbumService)
	album?: AlbumQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter files by release",
	})
	@TransformIdentifier(ReleaseService)
	release?: ReleaseQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter files by song",
	})
	@TransformIdentifier(SongService)
	song?: SongQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter files by track",
	})
	@TransformIdentifier(TrackService)
	track?: TrackQueryParameters.WhereInput;
}

@ApiTags("Files")
@Controller("files")
export default class FileController {
	constructor(
		private fileService: FileService,
		private registrationService: RegistrationService,
		private housekeepingService: HousekeepingService,
	) {}

	@ApiOperation({
		summary: "Get one file entry",
	})
	@Get(":idOrSlug")
	@Role(Roles.Default, Roles.Microservice)
	get(
		@RelationIncludeQuery(FileQueryParameters.AvailableAtomicIncludes)
		include: FileQueryParameters.RelationInclude,
		@IdentifierParam(FileService)
		where: FileQueryParameters.WhereInput,
	): Promise<File> {
		return this.fileService.get(where, include);
	}

	@ApiOperation({
		summary: "Get multiple file entries",
	})
	@Role(Roles.Admin, Roles.Microservice)
	@Get()
	@Response({
		returns: File,
		type: ResponseType.Page,
	})
	getMany(
		@Query() selector: Selector,
		@Query()
		paginationParameters: PaginationParameters,
	) {
		return this.fileService.getMany(selector, paginationParameters);
	}

	@ApiOperation({
		summary: "Delete multiple file entries",
	})
	@Role(Roles.Admin, Roles.Microservice)
	@Delete()
	async deleteMany(@Body() toDelete: FileDeletionDto) {
		if (toDelete.ids.length === 0) {
			return;
		}
		await this.registrationService.unregisterFiles(
			toDelete.ids.map((id) => ({ id })),
		);
		await this.housekeepingService.runHousekeeping();
	}
}
