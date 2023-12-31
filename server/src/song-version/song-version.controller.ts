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

import {
	Body,
	Controller,
	Get,
	Inject,
	Param,
	ParseIntPipe,
	Post,
	Query,
	forwardRef,
} from "@nestjs/common";
import {
	ApiOperation,
	ApiPropertyOptional,
	ApiTags,
	IntersectionType,
} from "@nestjs/swagger";
import SongVersionService from "./song-version.service";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
import SongQueryParameters from "src/song/models/song.query-params";
import SongService from "src/song/song.service";
import SortingQuery from "src/sort/sort-query.decorator";
import { SongVersionResponseBuilder } from "./models/song-version.response";
import { SongType } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";
import TransformIdentifier from "src/identifier/identifier.transform";
import ReleaseQueryParameters from "src/release/models/release.query-parameters";
import ReleaseService from "src/release/release.service";
import Response, { ResponseType } from "src/response/response.decorator";
import SongVersionQueryParameters from "./models/song-version.query-params";
import UpdateSongVersionDTO from "./models/update-song-version.dto";
import IdentifierParam from "src/identifier/identifier.pipe";
import LibraryService from "src/library/library.service";
import LibraryQueryParameters from "src/library/models/library.query-parameters";
import ArtistService from "src/artist/artist.service";
import ArtistQueryParameters from "src/artist/models/artist.query-parameters";

export class Selector extends IntersectionType(
	SongVersionQueryParameters.SortingParameter,
) {
	@IsEnum(SongType)
	@IsOptional()
	@ApiPropertyOptional({
		enum: SongType,
		description: "Filter the versions by type",
	})
	type?: SongType;
	@IsOptional()
	@ApiPropertyOptional({
		description:
			"Filter song versions using the parent library",
	})
	@TransformIdentifier(LibraryService)
	library: LibraryQueryParameters.WhereInput;
	@IsOptional()
	@ApiPropertyOptional({
		description:
			"Filter song versions using the parent artist",
	})
	@TransformIdentifier(ArtistService)
	artist: ArtistQueryParameters.WhereInput;
	@IsOptional()
	@ApiPropertyOptional({
		description:
			"Filter songs that are B-Sides of a release.\nThe release must be a studio recording, otherwise returns an  emtpy list",
	})
	@TransformIdentifier(ReleaseService)
	bsides: ReleaseQueryParameters.WhereInput;
	@IsOptional()
	@ApiPropertyOptional({
		description: "Filter versions by song",
	})
	@TransformIdentifier(SongService)
	song: SongQueryParameters.WhereInput;
}

@ApiTags("Song Versions")
@Controller("versions")
export class SongVersionController {
	constructor(
		@Inject(forwardRef(() => SongVersionService))
		private songVersionService: SongVersionService,
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
	) {}

	@ApiOperation({
		summary: "Get a song's versions",
	})
	@Response({
		handler: SongVersionResponseBuilder,
		type: ResponseType.Page,
	})
	@Get()
	async getSongVersions(
		@Query()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(
			SongVersionQueryParameters.AvailableAtomicIncludes,
		)
		include: SongVersionQueryParameters.RelationInclude,
		@SortingQuery(SongVersionQueryParameters.SortingKeys)
		sortingParameter: SongVersionQueryParameters.SortingParameter,
		@Query() selector: Selector,
	) {
		if (selector.bsides) {
			return this.songService.getReleaseBSides(
				selector.bsides,
				paginationParameters,
				include,
				selector,
			);
		}
		return this.songVersionService.getMany(
			selector,
			paginationParameters,
			include,
			sortingParameter,
		);
	}

	@ApiOperation({
		summary: "Get a song version",
	})
	@Response({ handler: SongVersionResponseBuilder })
	@Get(":id")
	async getSongVersion(
		@Param("id", ParseIntPipe)
		versionId: number,
		@RelationIncludeQuery(
			SongVersionQueryParameters.AvailableAtomicIncludes,
		)
		include: SongVersionQueryParameters.RelationInclude,
	) {
		return this.songVersionService.get({ id: versionId }, include);
	}

	@ApiOperation({
		summary: "Get a song's main version",
	})
	@Response({ handler: SongVersionResponseBuilder })
	@Get("main/:idOrSlug")
	async getSongMainVersion(
		@RelationIncludeQuery(
			SongVersionQueryParameters.AvailableAtomicIncludes,
		)
		include: SongVersionQueryParameters.RelationInclude,
		@IdentifierParam(SongService)
		where: SongQueryParameters.WhereInput,
	) {
		return this.songVersionService.getMainVersion(where, include);
	}

	@ApiOperation({
		summary: "Update a song version",
	})
	@Response({ handler: SongVersionResponseBuilder })
	@Post(":id")
	async updateSongVersion(
		@Body() updateDTO: UpdateSongVersionDTO,
		@Param("id", ParseIntPipe)
		versionId: number,
	) {
		return this.songVersionService.update(updateDTO, { id: versionId });
	}
}
