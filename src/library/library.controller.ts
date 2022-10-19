import { Body, Controller, Delete, Get, Post, Query, Req } from '@nestjs/common';
import LibraryService from './library.service';
import LibraryDto from './models/create-library.dto';
import { Library } from 'src/prisma/models';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
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
import ParseLibraryIdentifierPipe from './library.pipe';
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
import { IdentifierParam } from 'src/identifier/identifier-param.decorator';

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
	@Post('new')
	async createLibrary(@Body() createLibraryDto: LibraryDto) {
		return await this.libraryService.buildResponse(
			await this.libraryService.create(createLibraryDto)
		);
	}

	@ApiOperation({
		summary: 'Get a library'
	})
	@Get(':idOrSlug')
	async getLibrary(
		@IdentifierParam(ParseLibraryIdentifierPipe)
		where: LibraryQueryParameters.WhereInput,
	): Promise<Library> {
		return this.libraryService.get(where);
	}

	@ApiOperation({
		summary: 'Get all libraries'
	})
	@Get()
	@ApiPaginatedResponse(Library)
	async getLibraries(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@Query(LibraryQueryParameters.ParseSortingParameterPipe)
		sortingParameter: LibraryQueryParameters.SortingParameter,
		@Req() request: Request
	): Promise<PaginatedResponse<Object>> {
		return new PaginatedResponse(
			await this.libraryService.getMany({}, paginationParameters, {}, sortingParameter),
			request
		);
	}

	@ApiOperation({
		summary: 'Delete a library'
	})
	@Delete(':idOrSlug')
	async deleteLibrary(
		@IdentifierParam(ParseLibraryIdentifierPipe)
		where: LibraryQueryParameters.WhereInput,
	): Promise<void> {
		this.libraryService.delete(where);
	}

	@ApiOperation({
		summary: 'Get all album artists from a library'
	})
	@ApiPaginatedResponse(ArtistResponse)
	@Get(':idOrSlug/artists')
	async getArtistsByLibrary(
		@IdentifierParam(ParseLibraryIdentifierPipe)
		where: LibraryQueryParameters.WhereInput,
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@Query('with', ArtistQueryParameters.ParseRelationIncludePipe)
		include: ArtistQueryParameters.RelationInclude,
		@Query(ArtistQueryParameters.ParseSortingParameterPipe)
		sortingParameter: ArtistQueryParameters.SortingParameter,
		@Req() request: Request
	): Promise<PaginatedResponse<Object>> {
		const artists = await this.artistService.getAlbumsArtists(
			{ byLibrarySource: where }, paginationParameters, include, sortingParameter
		);
		if (artists.length == 0)
			await this.libraryService.throwIfNotFound(where);
		return new PaginatedResponse(
			await Promise.all(artists.map((artist) => this.artistService.buildResponse(artist))),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all albums from a library'
	})
	@ApiPaginatedResponse(AlbumResponse)
	@Get(':idOrSlug/albums')
	async getAlbumsByLibrary(
		@IdentifierParam(ParseLibraryIdentifierPipe)
		where: LibraryQueryParameters.WhereInput,
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude,
		@Query(AlbumQueryParameters.ParseSortingParameterPipe)
		sortingParameter: AlbumQueryParameters.SortingParameter,
		@Query() filter: AlbumQueryParameters.AlbumFilterParameter,
		@Req() request: Request
	): Promise<PaginatedResponse<Object>> {
		const albums = await this.albumService.getMany(
			{ byLibrarySource: where, byType: filter.type }, paginationParameters, include, sortingParameter
		);
		if (albums.length == 0)
			await this.libraryService.throwIfNotFound(where);
		return new PaginatedResponse(
			await Promise.all(albums.map((album) => this.albumService.buildResponse(album))),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all releases from a library'
	})
	@ApiPaginatedResponse(ReleaseResponse)
	@Get(':idOrSlug/releases')
	async getReleasesByLibrary(
		@IdentifierParam(ParseLibraryIdentifierPipe)
		where: LibraryQueryParameters.WhereInput,
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@Query('with', ReleaseQueryParameters.ParseRelationIncludePipe)
		include: ReleaseQueryParameters.RelationInclude,
		@Query(ReleaseQueryParameters.ParseSortingParameterPipe)
		sortingParameter: ReleaseQueryParameters.SortingParameter,
		@Req() request: Request
	): Promise<PaginatedResponse<Object>> {
		const releases = await this.releaseService.getMany(
			{ library: where }, paginationParameters, include, sortingParameter
		);
		if (releases.length == 0)
			await this.libraryService.throwIfNotFound(where);
		return new PaginatedResponse(
			await Promise.all(releases.map((release) => this.releaseService.buildResponse(release))),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all songs from a library'
	})
	@ApiPaginatedResponse(SongResponse)
	@Get(':idOrSlug/songs')
	async getSongsByLibrary(
		@IdentifierParam(ParseLibraryIdentifierPipe)
		where: LibraryQueryParameters.WhereInput,
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@Query('with', SongQueryParameters.ParseRelationIncludePipe)
		include: SongQueryParameters.RelationInclude,
		@Query(SongQueryParameters.ParseSortingParameterPipe)
		sortingParameter: SongQueryParameters.SortingParameter,
		@Req() request: Request
	): Promise<PaginatedResponse<Object>> {
		const songs =  await this.songService.getMany(
			{ library: where }, paginationParameters, include, sortingParameter
		);
		if (songs.length == 0)
			await this.libraryService.throwIfNotFound(where);
		return new PaginatedResponse(
			await Promise.all(songs.map((song) => this.songService.buildResponse(song))),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all tracks from a library'
	})
	@ApiPaginatedResponse(TrackResponse)
	@Get(':idOrSlug/tracks')
	async getTracksByLibrary(
		@IdentifierParam(ParseLibraryIdentifierPipe)
		where: LibraryQueryParameters.WhereInput,
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@Query('with',TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
		@Query(TrackQueryParameters.ParseSortingParameterPipe)
		sortingParameter: TrackQueryParameters.SortingParameter,
		@Req() request: Request
	): Promise<PaginatedResponse<Object>> {
		const tracks = await this.trackService.getMany(
			{ byLibrarySource: where }, paginationParameters, include, sortingParameter
		);
		if (tracks.length == 0)
			await this.libraryService.throwIfNotFound(where);
		return new PaginatedResponse(
			await Promise.all(tracks.map(
				(track) => this.trackService.buildResponse(track)
			)),
			request
		);
	}
}
