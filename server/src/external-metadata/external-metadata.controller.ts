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

import { Body, Controller, Get, Injectable, Post } from "@nestjs/common";
import { ExternalMetadataResponse } from "./models/external-metadata.response";
import { ApiTags } from "@nestjs/swagger";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import AlbumService from "src/album/album.service";
import IdentifierParam from "src/identifier/identifier.pipe";
import ArtistService from "src/artist/artist.service";
import ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import SongQueryParameters from "src/song/models/song.query-params";
import SongService from "src/song/song.service";
import ReleaseService from "src/release/release.service";
import ReleaseQueryParameters from "src/release/models/release.query-parameters";
import ExternalMetadataQueryParameters from "./models/external-metadata.query-parameters";
import ExternalMetadataService from "./external-metadata.service";
import { CreateExternalMetadataDto } from "./models/external-metadata.dto";

@ApiTags("External Metadata")
@Controller("external-metadata")
@Injectable()
export default class ExternalMetadataController {
	constructor(private externalMetadataService: ExternalMetadataService) {}
	@Post()
	async saveMetadata(@Body() creationDto: CreateExternalMetadataDto) {
		return this.externalMetadataService.saveMetadata(creationDto);
	}
	@Get("album/:idOrSlug")
	async getAlbumExternalMetadataEntry(
		@IdentifierParam(AlbumService)
		where: AlbumQueryParameters.WhereInput,
	) {
		return this.getExternalMetadataEntry({ album: where });
	}
	@Get("artist/:idOrSlug")
	async getArtistExternalMetadataEntry(
		@IdentifierParam(ArtistService)
		where: ArtistQueryParameters.WhereInput,
	) {
		return this.getExternalMetadataEntry({ artist: where });
	}
	@Get("song/:idOrSlug")
	async getSongExternalMetadataEntry(
		@IdentifierParam(SongService)
		where: SongQueryParameters.WhereInput,
	) {
		return this.getExternalMetadataEntry({ song: where });
	}
	@Get("release/:idOrSlug")
	async getReleaseExternalMetadataEntry(
		@IdentifierParam(ReleaseService)
		where: ReleaseQueryParameters.WhereInput,
	) {
		return this.getExternalMetadataEntry({ release: where });
	}

	private getExternalMetadataEntry(
		where: ExternalMetadataQueryParameters.WhereInput,
	): Promise<ExternalMetadataResponse> {
		return this.externalMetadataService.get(where);
	}
}
