import { Body, Controller, Get, Logger, Param, Post, Query } from '@nestjs/common';
import LibraryService from './library.service';
import LibraryDto from './models/create-library.dto';
import type { Library } from '@prisma/client';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ParseRelationIncludePipe from 'src/relation-include/relation-include.pipe';
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
import type LibraryQueryParameters from './models/library.query-parameters';
import ParseLibraryIdentifierPipe from './library.pipe';

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

	@Post('new')
	async createLibrary(@Body() createLibraryDto: LibraryDto) {
		return this.libraryService.createLibrary(createLibraryDto);
	}
	@Get()
	async getLibraries(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
	) {
		return this.libraryService.getLibraries({}, paginationParameters);
	}
		
	@Get('scan')
	async scanLibrariesFiles() {
		const libraries = await this.libraryService.getLibraries({});
		libraries.forEach((library) => this.libraryService
			.registerNewFiles(library)
			.catch((error) => Logger.error(error))
		);
		return `Scanning ${libraries.length} libraries`
	}

	@Get('clean')
	async cleanLibraries() {
		const libraries = await this.libraryService.getLibraries({});
		libraries.forEach((library) => this.libraryService
			.unregisterUnavailableFiles({ id: library.id })
			.catch((error) => Logger.error(error))
		);
		return `Cleanning ${libraries.length} libraries`;
	}

	@Get('scan/:idOrSlug')
	async scanLibraryFiles(
		@Param(ParseLibraryIdentifierPipe) where: LibraryQueryParameters.WhereInput
	) {
		let library = await this.libraryService.getLibrary(where);
		this.libraryService
			.registerNewFiles(library)
			.catch((error) => Logger.error(error));
	}

	@Get('clean/:idOrSlug')
	async cleanLibrary(
		@Param(ParseLibraryIdentifierPipe) where: LibraryQueryParameters.WhereInput
	) {
		this.libraryService
			.unregisterUnavailableFiles(where)
			.catch((error) => Logger.error(error));
	}

	@Get(':idOrSlug')
	async getLibrary(
		@Param(ParseLibraryIdentifierPipe) where: LibraryQueryParameters.WhereInput,
	): Promise<Library> {
		return this.libraryService.getLibrary(where);
	}
	
	@Get(':idOrSlug/artists')
	async getArtistsByLibrary(
		@Param(ParseLibraryIdentifierPipe)
		where: LibraryQueryParameters.WhereInput,
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', new ParseRelationIncludePipe(ArtistQueryParameters.AvailableIncludes))
		include: ArtistQueryParameters.RelationInclude
	): Promise<Object[]> {
		const artists = await this.artistService.getArtists(
			{ byLibrarySource: where }, paginationParameters, include
		);
		if (artists.length == 0)
			await this.libraryService.getLibrary(where);
		return artists.map((artist) => this.artistService.buildArtistResponse(artist));
	}

	@Get(':idOrSlug/albums')
	async getAlbumsByLibrary(
		@Param(ParseLibraryIdentifierPipe)
		where: LibraryQueryParameters.WhereInput,
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', new ParseRelationIncludePipe(AlbumQueryParameters.AvailableIncludes))
		include: AlbumQueryParameters.RelationInclude
	): Promise<Object[]> {
		const albums = await this.albumService.getAlbums(
			{ byLibrarySource: where }, paginationParameters, include
		);
		if (albums.length == 0)
			await this.libraryService.getLibrary(where);
		return albums.map((album) => this.albumService.buildAlbumResponse(album));
	}

	@Get(':idOrSlug/releases')
	async getReleasesByLibrary(
		@Param(ParseLibraryIdentifierPipe)
		where: LibraryQueryParameters.WhereInput,
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', new ParseRelationIncludePipe(ReleaseQueryParameters.AvailableIncludes))
		include: ReleaseQueryParameters.RelationInclude
	): Promise<Object[]> {
		const releases = await this.releaseService.getReleases({ library: where }, paginationParameters, include);
		if (releases.length == 0)
			await this.libraryService.getLibrary(where);
		return releases.map((release) => this.releaseService.buildReleaseResponse(release));
	}

	@Get(':idOrSlug/songs')
	async getSongsByLibrary(
		@Param(ParseLibraryIdentifierPipe)
		where: LibraryQueryParameters.WhereInput,
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', new ParseRelationIncludePipe(SongQueryParameters.AvailableIncludes))
		include: SongQueryParameters.RelationInclude
	): Promise<Object[]> {
		const songs =  await this.songService.getSongs(
			{ library: where }, paginationParameters, include
		);
		if (songs.length == 0)
			await this.libraryService.getLibrary(where);
		return songs.map((song) => this.songService.buildSongResponse(song));
	}

	@Get(':idOrSlug/tracks')
	async getTracksByLibrary(
		@Param(ParseLibraryIdentifierPipe)
		where: LibraryQueryParameters.WhereInput,
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', new ParseRelationIncludePipe(TrackQueryParameters.AvailableIncludes))
		include: TrackQueryParameters.RelationInclude
	): Promise<Object[]> {
		const tracks = await this.trackService.getTracks(
			{ byLibrarySource: where }, paginationParameters, include
		);
		if (tracks.length == 0)
			await this.libraryService.getLibrary(where);
		return tracks.map((track) => this.trackService.buildTrackResponse(track));
	}
}
