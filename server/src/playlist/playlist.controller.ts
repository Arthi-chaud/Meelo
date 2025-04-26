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
	Req,
} from "@nestjs/common";
import { ApiOperation, ApiPropertyOptional, ApiTags } from "@nestjs/swagger";
import { User } from "@prisma/client";
import { IsOptional } from "class-validator";
import AlbumService from "src/album/album.service";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import { Role } from "src/authentication/roles/roles.decorators";
import Roles from "src/authentication/roles/roles.enum";
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
	@Role(Roles.Default)
	@Response({ handler: PlaylistResponseBuilder })
	async get(
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
		@RelationIncludeQuery(PlaylistQueryParameters.AvailableAtomicIncludes)
		include: PlaylistQueryParameters.RelationInclude,
		@Req() req: Express.Request,
	) {
		return this.playlistService.get(where, this._getUserId(req), include);
	}

	@ApiOperation({
		summary: "Get many playlists",
	})
	@Get()
	@Role(Roles.Default)
	@Response({ handler: PlaylistResponseBuilder, type: ResponseType.Page })
	async getMany(
		@Query() selector: Selector,
		@Query() sort: PlaylistQueryParameters.SortingParameter,
		@RelationIncludeQuery(PlaylistQueryParameters.AvailableAtomicIncludes)
		include: PlaylistQueryParameters.RelationInclude,
		@Query()
		paginationParameters: PaginationParameters,
		@Req() req: Express.Request,
	) {
		return this.playlistService.getMany(
			selector,
			this._getUserId(req),
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
	@Role(Roles.Default)
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
		@Req() req: Express.Request,
	) {
		return this.playlistService.getEntries(
			where,
			this._getUserId(req),
			paginationParameters,
			include,
		);
	}

	@ApiOperation({
		summary: "Create playlist",
		description: "User has to be authenticated",
	})
	@Post()
	@Role(Roles.User)
	@Response({ handler: PlaylistResponseBuilder })
	async createPlaylist(
		@Body()
		creationDto: CreatePlaylistDTO,
		@Req() req: Express.Request,
	) {
		return this.playlistService.create({
			...creationDto,
			ownerId: this._getUserId(req)!,
		});
	}

	@ApiOperation({
		summary: "Update playlist",
	})
	@Put(":idOrSlug")
	@Role(Roles.User)
	@Response({ handler: PlaylistResponseBuilder })
	async updatePlaylist(
		@Body()
		updateDto: UpdatePlaylistDTO,
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
		@Req() req: Express.Request,
	) {
		return this.playlistService.update(
			updateDto,
			where,
			this._getUserId(req)!,
		);
	}

	@ApiOperation({
		summary: "Delete playlist",
		description: "User has to be authenticated",
	})
	@Delete(":idOrSlug")
	@Role(Roles.User)
	async delete(
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
		@Req() req: Express.Request,
	) {
		await this.playlistService.delete(where, this._getUserId(req)!);
	}

	@ApiOperation({
		summary: "Add song to playlist",
	})
	@Role(Roles.User)
	@Post(":idOrSlug/entries")
	async addSongToPlaylist(
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
		@Body()
		playlistEntryDTO: CreatePlaylistEntryDTO,
		@Req() req: Express.Request,
	) {
		await this.playlistService.addSong(
			{ id: playlistEntryDTO.songId },
			this._getUserId(req)!,
			where,
		);
	}

	@ApiOperation({
		summary: "Reorder entries in playlist",
	})
	@Role(Roles.User)
	@Put(":idOrSlug/entries/reorder")
	async moveEntryInPlaylist(
		@Body()
		{ entryIds }: ReorderPlaylistDTO,
		@IdentifierParam(PlaylistService)
		where: PlaylistQueryParameters.WhereInput,
		@Req() req: Express.Request,
	) {
		await this.playlistService.reorderPlaylist(
			where,
			this._getUserId(req)!,
			entryIds,
		);
	}

	@ApiOperation({
		summary: "Delete playlist entry",
		description: "This will delete a song from the playlist",
	})
	@Delete("entries/:id")
	@Role(Roles.User)
	async deleteEntryInPlaylist(
		@Param("id", new ParseIntPipe())
		entryId: number,
		@Req() req: Express.Request,
	) {
		await this.playlistService.removeEntry(entryId, this._getUserId(req)!);
	}

	private _getUserId(req: Express.Request): number | null {
		return (req.user as User)?.id ?? null;
	}
}
