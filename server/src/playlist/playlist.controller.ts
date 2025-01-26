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
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Post,
	Put,
	Query,
} from "@nestjs/common";
import { ApiOperation, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import AlbumService from "src/album/album.service";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import IdentifierParam from "src/identifier/identifier.pipe";
import TransformIdentifier from "src/identifier/identifier.transform";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
import Response, { ResponseType } from "src/response/response.decorator";
import SongQueryParameters from "src/song/models/song.query-params";
import {
	CreatePlaylistDTO,
	CreatePlaylistEntryDTO,
	ReorderPlaylistDTO,
	UpdatePlaylistDTO,
} from "./models/playlist.dto";
import PlaylistQueryParameters from "./models/playlist.query-parameters";
import {
	PlaylistEntryResponseBuilder,
	PlaylistResponseBuilder,
} from "./models/playlist.response";
import PlaylistService from "./playlist.service";

export class Selector {
	@IsOptional()
	@ApiPropertyOptional({
		description: "Get playlists that have a song in common with an album",
	})
	@TransformIdentifier(AlbumService)
	album?: AlbumQueryParameters.WhereInput;
}

@Controller("playlists")
@ApiTags("Playlists")
export default class PlaylistController {
	constructor(private playlistService: PlaylistService) {}

	@ApiOperation({
		summary: "Get one playlist",
	})
	@Get(":idOrSlug")
	@Response({ handler: PlaylistResponseBuilder })
	async get(
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
		@RelationIncludeQuery(PlaylistQueryParameters.AvailableAtomicIncludes)
		include: PlaylistQueryParameters.RelationInclude,
	) {
		return this.playlistService.get(where, include);
	}

	@ApiOperation({
		summary: "Get many playlists",
	})
	@Get()
	@Response({ handler: PlaylistResponseBuilder, type: ResponseType.Page })
	async getMany(
		@Query() selector: Selector,
		@Query() sort: PlaylistQueryParameters.SortingParameter,
		@RelationIncludeQuery(PlaylistQueryParameters.AvailableAtomicIncludes)
		include: PlaylistQueryParameters.RelationInclude,
		@Query()
		paginationParameters: PaginationParameters,
	) {
		return this.playlistService.getMany(
			selector,
			sort,
			paginationParameters,
			include,
		);
	}

	@ApiOperation({
		summary: "Get a playlist's entries",
		description: "Entries as song with an 'entryId' field",
	})
	@Get(":idOrSlug/entries")
	@Response({
		handler: PlaylistEntryResponseBuilder,
		type: ResponseType.Page,
	})
	async getEntries(
		@Query()
		paginationParameters: PaginationParameters,
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
		@RelationIncludeQuery(SongQueryParameters.AvailableAtomicIncludes)
		include: SongQueryParameters.RelationInclude,
	) {
		return this.playlistService.getEntries(
			where,
			paginationParameters,
			include,
		);
	}

	@ApiOperation({
		summary: "Create playlist",
	})
	@Post()
	@Response({ handler: PlaylistResponseBuilder })
	async createPlaylist(
		@Body()
		creationDto: CreatePlaylistDTO,
	) {
		return this.playlistService.create(creationDto);
	}

	@ApiOperation({
		summary: "Update playlist",
	})
	@Put(":idOrSlug")
	@Response({ handler: PlaylistResponseBuilder })
	async updatePlaylist(
		@Body()
		updateDto: UpdatePlaylistDTO,
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
	) {
		return this.playlistService.update(updateDto, where);
	}

	@ApiOperation({
		summary: "Delete playlist",
	})
	@Delete(":idOrSlug")
	async delete(
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
	) {
		await this.playlistService.delete(where);
	}

	@ApiOperation({
		summary: "Add song to playlist",
	})
	@Post(":idOrSlug/entries")
	async addSongToPlaylist(
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
		@Body()
		playlistEntryDTO: CreatePlaylistEntryDTO,
	) {
		await this.playlistService.addSong(
			{ id: playlistEntryDTO.songId },
			where,
		);
	}

	@ApiOperation({
		summary: "Reorder entries in playlist",
	})
	@Put(":idOrSlug/entries/reorder")
	async moveEntryInPlaylist(
		@Body()
		{ entryIds }: ReorderPlaylistDTO,
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
	) {
		await this.playlistService.reorderPlaylist(where, entryIds);
	}

	@ApiOperation({
		summary: "Delete playlist entry",
		description: "This will delete a song from the playlist",
	})
	@Delete("entries/:id")
	async deleteEntryInPlaylist(
		@Param("id", new ParseIntPipe())
		entryId: number,
	) {
		await this.playlistService.removeEntry(entryId);
	}
}
