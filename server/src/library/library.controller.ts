import {
	Body, Controller, Delete, Get,
	Post, Put, Query
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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ArtistResponseBuilder } from 'src/artist/models/artist.response';
import { AlbumResponseBuilder } from 'src/album/models/album.response';
import { ReleaseResponseBuilder } from 'src/release/models/release.response';
import { SongResponseBuilder } from 'src/song/models/song.response';
import { TrackResponseBuilder } from 'src/track/models/track.response';
import { PaginationQuery } from 'src/pagination/pagination-query.decorator';
import RelationIncludeQuery from 'src/relation-include/relation-include-query.decorator';
import SortingQuery from 'src/sort/sort-query.decorator';
import Admin from 'src/roles/admin.decorator';
import UpdateLibraryDto from './models/update-library.dto';
import CreateLibraryDto from './models/create-library.dto';
import IdentifierParam from 'src/identifier/identifier.pipe';
import Response, { ResponseType } from 'src/response/response.decorator';

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
		return this.libraryService.create(createLibraryDto);
	}

	@ApiOperation({
		summary: 'Get a library'
	})
	@Get(':idOrSlug')
	async getLibrary(
		@IdentifierParam(LibraryService)
		where: LibraryQueryParameters.WhereInput
	): Promise<Library> {
		return this.libraryService.get(where);
	}

	@ApiOperation({
		summary: 'Update a new library'
	})
	@Admin()
	@Put(':idOrSlug/update')
	async updateLibrary(
		@Body() updateLibraryDTO: UpdateLibraryDto,
		@IdentifierParam(LibraryService)
		where: LibraryQueryParameters.WhereInput,
	): Promise<Library> {
		return this.libraryService.update(updateLibraryDTO, where);
	}

	@ApiOperation({
		summary: 'Get all libraries'
	})
	@Get()
	@Response({
		returns: Library,
		type: ResponseType.Page
	})
	async getLibraries(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@SortingQuery(LibraryQueryParameters.SortingKeys)
		sortingParameter: LibraryQueryParameters.SortingParameter,
	) {
		return this.libraryService.getMany(
			{}, paginationParameters, {}, sortingParameter
		);
	}

	@ApiOperation({
		summary: 'Delete a library'
	})
	@Admin()
	@Delete(':idOrSlug')
	async deleteLibrary(
		@IdentifierParam(LibraryService)
		where: LibraryQueryParameters.WhereInput,
	) {
		const library = await this.libraryService.get(where);

		await this.libraryService.delete(where);
		return library;
	}

	@ApiOperation({
		summary: 'Get all album artists from a library'
	})
	@Response({
		handler: ArtistResponseBuilder,
		type: ResponseType.Page
	})
	@Get(':idOrSlug/artists')
	async getArtistsByLibrary(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(ArtistQueryParameters.AvailableAtomicIncludes)
		include: ArtistQueryParameters.RelationInclude,
		@SortingQuery(ArtistQueryParameters.SortingKeys)
		sortingParameter: ArtistQueryParameters.SortingParameter,
		@IdentifierParam(LibraryService)
		where: LibraryQueryParameters.WhereInput
	) {
		const artists = await this.artistService.getAlbumsArtists(
			{ library: where }, paginationParameters, include, sortingParameter
		);

		if (artists.length == 0) {
			await this.libraryService.throwIfNotFound(where);
		}
		return artists;
	}

	@ApiOperation({
		summary: 'Get all albums from a library'
	})
	@Response({
		handler: AlbumResponseBuilder,
		type: ResponseType.Page
	})
	@Get(':idOrSlug/albums')
	async getAlbumsByLibrary(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(AlbumQueryParameters.AvailableAtomicIncludes)
		include: AlbumQueryParameters.RelationInclude,
		@SortingQuery(AlbumQueryParameters.SortingKeys)
		sortingParameter: AlbumQueryParameters.SortingParameter,
		@Query() filter: AlbumQueryParameters.AlbumFilterParameter,
		@IdentifierParam(LibraryService)
		where: LibraryQueryParameters.WhereInput
	) {
		const albums = await this.albumService.getMany(
			{ library: where, type: filter.type },
			paginationParameters,
			include,
			sortingParameter
		);

		if (albums.length == 0) {
			await this.libraryService.throwIfNotFound(where);
		}
		return albums;
	}

	@ApiOperation({
		summary: 'Get all releases from a library'
	})
	@Response({
		handler: ReleaseResponseBuilder,
		type: ResponseType.Page
	})
	@Get(':idOrSlug/releases')
	async getReleasesByLibrary(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(ReleaseQueryParameters.AvailableAtomicIncludes)
		include: ReleaseQueryParameters.RelationInclude,
		@SortingQuery(ReleaseQueryParameters.SortingKeys)
		sortingParameter: ReleaseQueryParameters.SortingParameter,
		@IdentifierParam(LibraryService)
		where: LibraryQueryParameters.WhereInput
	) {
		const releases = await this.releaseService.getMany(
			{ library: where }, paginationParameters, include, sortingParameter
		);

		if (releases.length == 0) {
			await this.libraryService.throwIfNotFound(where);
		}
		return releases;
	}

	@ApiOperation({
		summary: 'Get all songs from a library'
	})
	@Response({
		handler: SongResponseBuilder,
		type: ResponseType.Page
	})
	@Get(':idOrSlug/songs')
	async getSongsByLibrary(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(SongQueryParameters.AvailableAtomicIncludes)
		include: SongQueryParameters.RelationInclude,
		@SortingQuery(SongQueryParameters.SortingKeys)
		sortingParameter: SongQueryParameters.SortingParameter,
		@IdentifierParam(LibraryService)
		where: LibraryQueryParameters.WhereInput
	) {
		const songs = await this.songService.getMany(
			{ library: where }, paginationParameters, include, sortingParameter
		);

		if (songs.length == 0) {
			await this.libraryService.throwIfNotFound(where);
		}
		return songs;
	}

	@ApiOperation({
		summary: 'Get all tracks from a library'
	})
	@Response({
		handler: TrackResponseBuilder,
		type: ResponseType.Page
	})
	@Get(':idOrSlug/tracks')
	async getTracksByLibrary(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include: TrackQueryParameters.RelationInclude,
		@SortingQuery(TrackQueryParameters.SortingKeys)
		sortingParameter: TrackQueryParameters.SortingParameter,
		@IdentifierParam(LibraryService)
		where: LibraryQueryParameters.WhereInput
	) {
		const tracks = await this.trackService.getMany(
			{ library: where }, paginationParameters, include, sortingParameter
		);

		if (tracks.length == 0) {
			await this.libraryService.throwIfNotFound(where);
		}
		return tracks;
	}
}
