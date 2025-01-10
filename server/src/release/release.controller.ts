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
	Controller,
	DefaultValuePipe,
	Get,
	Inject,
	ParseBoolPipe,
	Query,
	Res,
	forwardRef,
} from "@nestjs/common";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import ReleaseQueryParameters from "./models/release.query-parameters";
import ReleaseService from "./release.service";
import TrackService from "src/track/track.service";
import AlbumService from "src/album/album.service";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import type { Response as ExpressResponse } from "express";
import {
	ApiOkResponse,
	ApiOperation,
	ApiPropertyOptional,
	ApiTags,
} from "@nestjs/swagger";
import { TrackResponseBuilder } from "src/track/models/track.response";
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
import IdentifierParam from "src/identifier/identifier.pipe";
import Response, { ResponseType } from "src/response/response.decorator";
import { ReleaseResponseBuilder } from "./models/release.response";
import { IsOptional } from "class-validator";
import TransformIdentifier from "src/identifier/identifier.transform";
import LibraryService from "src/library/library.service";
import LibraryQueryParameters from "src/library/models/library.query-parameters";
import SongQueryParameters from "src/song/models/song.query-params";

class Selector {
	@IsOptional()
	@ApiPropertyOptional({
		description: `Filter releases by albums`,
	})
	@TransformIdentifier(AlbumService)
	album?: AlbumQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: `Filter releases by library`,
	})
	@TransformIdentifier(LibraryService)
	library?: LibraryQueryParameters.WhereInput;
}

@ApiTags("Releases")
@Controller("releases")
export default class ReleaseController {
	constructor(
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
	) {}

	@ApiOperation({
		summary: "Get many releases",
	})
	@Get()
	@Response({
		handler: ReleaseResponseBuilder,
		type: ResponseType.Page,
	})
	async getReleases(
		@Query() selector: Selector,
		@Query() sort: ReleaseQueryParameters.SortingParameter,
		@Query()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(ReleaseQueryParameters.AvailableAtomicIncludes)
		include: ReleaseQueryParameters.RelationInclude,
	) {
		return this.releaseService.getMany(
			selector,
			sort,
			paginationParameters,
			include,
		);
	}

	@ApiOperation({
		summary: "Get a release",
	})
	@Response({ handler: ReleaseResponseBuilder })
	@Get(":idOrSlug")
	async getRelease(
		@IdentifierParam(ReleaseService)
		where: ReleaseQueryParameters.WhereInput,
		@RelationIncludeQuery(ReleaseQueryParameters.AvailableAtomicIncludes)
		include: ReleaseQueryParameters.RelationInclude,
	) {
		return this.releaseService.get(where, include);
	}

	@ApiOperation({
		summary: "Get the master release of an album",
	})
	@Response({ handler: ReleaseResponseBuilder })
	@Get("master/:idOrSlug")
	async getAlbumMaster(
		@RelationIncludeQuery(ReleaseQueryParameters.AvailableAtomicIncludes)
		include: ReleaseQueryParameters.RelationInclude,
		@IdentifierParam(AlbumService)
		where: AlbumQueryParameters.WhereInput,
	) {
		return this.releaseService.getMasterRelease(where, include);
	}

	@ApiOperation({
		summary: "Get the ordered tracklist of a release",
		description: "The returned entries are tracks",
	})
	@Response({ handler: TrackResponseBuilder, type: ResponseType.Page })
	@Get(":idOrSlug/tracklist")
	async getReleaseTracklist(
		@RelationIncludeQuery(SongQueryParameters.AvailableAtomicIncludes)
		include: SongQueryParameters.RelationInclude,
		@Query()
		paginationParameters: PaginationParameters,
		@Query(
			"exclusive",
			new ParseBoolPipe({ optional: true }),
			new DefaultValuePipe(false),
		)
		exclusiveOnly: boolean,
		@IdentifierParam(ReleaseService)
		where: ReleaseQueryParameters.WhereInput,
	) {
		return this.trackService.getTracklist(
			where,
			paginationParameters,
			exclusiveOnly,
			include,
		);
	}

	@ApiOperation({
		summary: "Download an archive of the release",
	})
	@ApiOkResponse({ description: "A ZIP Binary" })
	@Get(":idOrSlug/archive")
	async getReleaseArcive(
		@IdentifierParam(ReleaseService)
		where: ReleaseQueryParameters.WhereInput,
		@Res() response: ExpressResponse,
	) {
		return this.releaseService.pipeArchive(where, response);
	}
}
