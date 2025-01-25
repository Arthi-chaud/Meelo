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

import { Body, Controller, Get, Injectable, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import type AlbumQueryParameters from "src/album/models/album.query-parameters";
import AlbumService from "src/album/album.service";
import ArtistService from "src/artist/artist.service";
import type ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import type SongQueryParameters from "src/song/models/song.query-params";
import SongService from "src/song/song.service";
import ReleaseService from "src/release/release.service";
import type ReleaseQueryParameters from "src/release/models/release.query-parameters";
import type ExternalMetadataQueryParameters from "./models/external-metadata.query-parameters";
import type ExternalMetadataService from "./external-metadata.service";
import type { CreateExternalMetadataDto } from "./models/external-metadata.dto";
import Roles from "src/authentication/roles/roles.enum";
import { Role } from "src/authentication/roles/roles.decorators";
import { IsOptional } from "class-validator";
import TransformIdentifier from "src/identifier/identifier.transform";
import { InvalidRequestException } from "src/exceptions/meelo-exception";

class Selector {
	@IsOptional()
	@ApiPropertyOptional({
		description: "Identifier for album",
	})
	@TransformIdentifier(AlbumService)
	album?: AlbumQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Identifier for artist",
	})
	@TransformIdentifier(ArtistService)
	artist?: ArtistQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Identifier for release",
	})
	@TransformIdentifier(ReleaseService)
	release?: ReleaseQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: "Identifier for song",
	})
	@TransformIdentifier(SongService)
	song?: SongQueryParameters.WhereInput;
}

@ApiTags("External Metadata")
@Controller("external-metadata")
@Injectable()
export default class ExternalMetadataController {
	constructor(private externalMetadataService: ExternalMetadataService) {}

	@ApiOperation({
		summary: "Create an new metadata entry for any kind of resource",
	})
	@Role(Roles.Admin, Roles.Microservice)
	@Post()
	async saveMetadata(@Body() creationDto: CreateExternalMetadataDto) {
		return this.externalMetadataService.saveMetadata(creationDto);
	}

	@ApiOperation({
		summary: "Get the metadata entry",
	})
	@Get()
	async getExternalMetadataEntry(@Query() where: Selector) {
		const selectorSize = Object.keys(where).length;
		if (selectorSize !== 1) {
			throw new InvalidRequestException(
				`Expected at least one query parameter. Got ${selectorSize}`,
			);
		}
		return this.externalMetadataService.get(
			where as ExternalMetadataQueryParameters.WhereInput,
		);
	}
}
