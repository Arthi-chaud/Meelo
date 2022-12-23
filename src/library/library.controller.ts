import {
	Body, Controller, Delete, Get, Param,
	Post, Put, Query, Req
} from '@nestjs/common';
import LibraryService from './library.service';
import { Library } from 'src/prisma/models';
import { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ArtistService from 'src/artist/artist.service';
import ArtistQueryParameters from 'src/artist/models/artist.query-parameters';
import AlbumService from 'src/album/album.service';
import AlbumQueryParameters from 'src/album/models/album.query-parameters';
import ReleaseQueryParameters from 'src/release/models/release.query-parameters';
import SongQueryParameters from 'src/song/models/song.query-params';
import TrackQueryParameters from 'src/track/models/track.query-parameters';
import TrackService from 'src/track/track.service';
import ReleaseService from 'src/release/release.service';
import SongService from 'src/song/song.service';
import LibraryQueryParameters from './models/library.query-parameters';
import type { Request } from 'express';
import PaginatedResponse from 'src/pagination/models/paginated-response';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiPaginatedResponse } from 'src/pagination/paginated-response.decorator';
import { ArtistResponse } from 'src/artist/models/artist.response';
import { AlbumResponse } from 'src/album/models/album.response';
import { ReleaseResponse } from 'src/release/models/release.response';
import { SongResponse } from 'src/song/models/song.response';
import { TrackResponse } from 'src/track/models/track.response';
import { PaginationQuery } from 'src/pagination/pagination-query.decorator';
import RelationIncludeQuery from 'src/relation-include/relation-include-query.decorator';
import SortingQuery from 'src/sort/sort-query.decorator';
import Admin from 'src/roles/admin.decorator';
import UpdateLibraryDto from './models/update-library.dto';
import CreateLibraryDto from './models/create-library.dto';
import { IdentifierParam } from 'src/identifier/models/identifier';

@ApiTags("Libraries")
@Controller('libraries')
export default class LibraryController {
	constructor(
		private libraryService: LibraryService,
		private artistService: ArtistService,
		private albumService: AlbumService,
		private trackService: TrackService,
		private songService: SongService,
		private releaseService: ReleaseService,
	) { }

	@ApiOperation({
		summary: 'Create a new library'
	})
	@Admin()
	@Post('new')
	async createLibrary(@Body() createLibraryDto: CreateLibraryDto) {
		return this.libraryService.buildResponse(
			await this.libraryService.create(createLibraryDto)
		);
	}

	@ApiOperation({
		summary: 'Get a library'
	})
	@Get(':idOrSlug')
	async getLibrary(
		@Param() { idOrSlug }: IdentifierParam
	): Promise<Library> {
		const where = LibraryService.formatIdentifierToWhereInput(idOrSlug);

		return this.libraryService.get(where);
	}

	@ApiOperation({
		summary: 'Update a new library'
	})
	@Admin()
	@Put(':idOrSlug/update')
	async updateLibrary(
		@Param() { idOrSlug }: IdentifierParam,
		@Body() updateLibraryDTO: UpdateLibraryDto,
	) {
		const where = LibraryService.formatIdentifierToWhereInput(idOrSlug);

		return this.libraryService.buildResponse(
			await this.libraryService.update(updateLibraryDTO, where)
		);
	}

	@ApiOperation({
		summary: 'Get all libraries'
	})
	@Get()
	@ApiPaginatedResponse(Library)
	async getLibraries(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@SortingQuery(LibraryQueryParameters.SortingKeys)
		sortingParameter: LibraryQueryParameters.SortingParameter,
		@Req() request: Request
	): Promise<PaginatedResponse<Library>> {
		const libraries = await this.libraryService.getMany(
			{}, paginationParameters, {}, sortingParameter
		);

		return PaginatedResponse.awaiting(
			libraries.map((library) => this.libraryService.buildResponse(library)),
			request
		);
	}

	@ApiOperation({
		summary: 'Delete a library'
	})
	@Admin()
	@Delete(':idOrSlug')
	async deleteLibrary(
		@Param() { idOrSlug }: IdentifierParam
	) {
		const where = LibraryService.formatIdentifierToWhereInput(idOrSlug);
		const library = await this.libraryService.get(where);

		await this.libraryService.delete(where);
		return this.libraryService.buildResponse(library);
	}

	@ApiOperation({
		summary: 'Get all album artists from a library'
	})
	@ApiPaginatedResponse(ArtistResponse)
	@Get(':idOrSlug/artists')
	async getArtistsByLibrary(
		@Param() { idOrSlug }: IdentifierParam,
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(ArtistQueryParameters.AvailableAtomicIncludes)
		include: ArtistQueryParameters.RelationInclude,
		@SortingQuery(ArtistQueryParameters.SortingKeys)
		sortingParameter: ArtistQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		const where = LibraryService.formatIdentifierToWhereInput(idOrSlug);
		const artists = await this.artistService.getAlbumsArtists(
			{ library: where }, paginationParameters, include, sortingParameter
		);

		if (artists.length == 0) {
			await this.libraryService.throwIfNotFound(where);
		}
		return PaginatedResponse.awaiting(
			artists.map((artist) => this.artistService.buildResponse(artist)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all albums from a library'
	})
	@ApiPaginatedResponse(AlbumResponse)
	@Get(':idOrSlug/albums')
	async getAlbumsByLibrary(
		@Param() { idOrSlug }: IdentifierParam,
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(AlbumQueryParameters.AvailableAtomicIncludes)
		include: AlbumQueryParameters.RelationInclude,
		@SortingQuery(AlbumQueryParameters.SortingKeys)
		sortingParameter: AlbumQueryParameters.SortingParameter,
		@Query() filter: AlbumQueryParameters.AlbumFilterParameter,
		@Req() request: Request
	) {
		const where = LibraryService.formatIdentifierToWhereInput(idOrSlug);
		const albums = await this.albumService.getMany(
			{ library: where, type: filter.type },
			paginationParameters,
			include,
			sortingParameter
		);

		if (albums.length == 0) {
			await this.libraryService.throwIfNotFound(where);
		}
		return PaginatedResponse.awaiting(
			albums.map((album) => this.albumService.buildResponse(album)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all releases from a library'
	})
	@ApiPaginatedResponse(ReleaseResponse)
	@Get(':idOrSlug/releases')
	async getReleasesByLibrary(
		@Param() { idOrSlug }: IdentifierParam,
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(ReleaseQueryParameters.AvailableAtomicIncludes)
		include: ReleaseQueryParameters.RelationInclude,
		@SortingQuery(ReleaseQueryParameters.SortingKeys)
		sortingParameter: ReleaseQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		const where = LibraryService.formatIdentifierToWhereInput(idOrSlug);
		const releases = await this.releaseService.getMany(
			{ library: where }, paginationParameters, include, sortingParameter
		);

		if (releases.length == 0) {
			await this.libraryService.throwIfNotFound(where);
		}
		return PaginatedResponse.awaiting(
			releases.map((release) => this.releaseService.buildResponse(release)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all songs from a library'
	})
	@ApiPaginatedResponse(SongResponse)
	@Get(':idOrSlug/songs')
	async getSongsByLibrary(
		@Param() { idOrSlug }: IdentifierParam,
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(SongQueryParameters.AvailableAtomicIncludes)
		include: SongQueryParameters.RelationInclude,
		@SortingQuery(SongQueryParameters.SortingKeys)
		sortingParameter: SongQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		const where = LibraryService.formatIdentifierToWhereInput(idOrSlug);
		const songs = await this.songService.getMany(
			{ library: where }, paginationParameters, include, sortingParameter
		);

		if (songs.length == 0) {
			await this.libraryService.throwIfNotFound(where);
		}
		return PaginatedResponse.awaiting(
			songs.map((song) => this.songService.buildResponse(song)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all tracks from a library'
	})
	@ApiPaginatedResponse(TrackResponse)
	@Get(':idOrSlug/tracks')
	async getTracksByLibrary(
		@Param() { idOrSlug }: IdentifierParam,
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include: TrackQueryParameters.RelationInclude,
		@SortingQuery(TrackQueryParameters.SortingKeys)
		sortingParameter: TrackQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		const where = LibraryService.formatIdentifierToWhereInput(idOrSlug);
		const tracks = await this.trackService.getMany(
			{ library: where }, paginationParameters, include, sortingParameter
		);

		if (tracks.length == 0) {
			await this.libraryService.throwIfNotFound(where);
		}
		return PaginatedResponse.awaiting(
			tracks.map(
				(track) => this.trackService.buildResponse(track)
			),
			request
		);
	}
}
