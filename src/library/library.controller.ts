import { Body, Controller, Get, Logger, Param, Post, Query } from '@nestjs/common';
import { ParseSlugPipe } from 'src/slug/pipe';
import Slug from 'src/slug/slug';
import LibraryService from './library.service';
import { LibraryDto } from './models/library.dto';
import type { Artist, Library, Release, Song, Track } from '@prisma/client';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import LibraryQueryParameters from './models/library.query-parameters';
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

const ParseLibraryRelationIncludePipe = new ParseRelationIncludePipe(LibraryQueryParameters.AvailableIncludes);

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
		return await this.libraryService.createLibrary(createLibraryDto);
	}
	@Get()
	async getLibraries(
		@Query(ParsePaginationParameterPipe) paginationParameters: PaginationParameters,
		@Query('with', ParseLibraryRelationIncludePipe) include: LibraryQueryParameters.RelationInclude
	) {
		return await this.libraryService.getLibraries({}, paginationParameters, include);
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

	@Get(':slug')
	async getLibrary(
		@Param('slug', ParseSlugPipe) slug: Slug,
		@Query('with', ParseLibraryRelationIncludePipe) include: LibraryQueryParameters.RelationInclude
	): Promise<Library> {
		return await this.libraryService.getLibrary({ slug: slug }, include);
	}

	@Get('clean')
	async cleanLibraries() {
		const libraries = await this.libraryService.getLibraries({});
		libraries.forEach((library) => this.libraryService
			.unregisterUnavailableFiles(new Slug(library.slug))
			.catch((error) => Logger.error(error))
		);
		return `Cleanning ${libraries.length} libraries`;
	}

	@Get('scan/:slug')
	async scanLibraryFiles(@Param('slug', ParseSlugPipe) slug: Slug) {
		let library = await this.libraryService.getLibrary({ slug: slug });
		this.libraryService
			.registerNewFiles(library)
			.catch((error) => Logger.error(error));
	}

	@Get('clean/:slug')
	async cleanLibrary(@Param('slug', ParseSlugPipe) slug: Slug) {
		this.libraryService
			.unregisterUnavailableFiles(slug)
			.catch((error) => Logger.error(error));
	}

	@Get('/:slug/artists')
	async getArtistsByLibrary(
		@Param('slug', ParseSlugPipe) slug: Slug,
		@Query(ParsePaginationParameterPipe) paginationParameters: PaginationParameters,
		@Query('with', new ParseRelationIncludePipe(ArtistQueryParameters.AvailableIncludes)) include: ArtistQueryParameters.RelationInclude
	): Promise<Artist[]> {
		return await this.artistService.getArtists({ byLibrarySource: {
			slug: slug
		} }, paginationParameters, include);
	}

	@Get('/:slug/albums')
	async getAlbumsByLibrary(
		@Param('slug', ParseSlugPipe) slug: Slug,
		@Query(ParsePaginationParameterPipe) paginationParameters: PaginationParameters,
		@Query('with', new ParseRelationIncludePipe(AlbumQueryParameters.AvailableIncludes)) include: AlbumQueryParameters.RelationInclude
	): Promise<Artist[]> {
		return await this.albumService.getAlbums({ byLibrarySource: {
			slug: slug
		} }, paginationParameters, include);
	}

	@Get('/:slug/releases')
	async getReleasesByLibrary(
		@Param('slug', ParseSlugPipe) slug: Slug,
		@Query(ParsePaginationParameterPipe) paginationParameters: PaginationParameters,
		@Query('with', new ParseRelationIncludePipe(ReleaseQueryParameters.AvailableIncludes)) include: ReleaseQueryParameters.RelationInclude
	): Promise<Release[]> {
		return await this.releaseService.getReleases({ library: {
			slug: slug
		} }, paginationParameters, include);
	}

	@Get('/:slug/songs')
	async getSongsByLibrary(
		@Param('slug', ParseSlugPipe) slug: Slug,
		@Query(ParsePaginationParameterPipe) paginationParameters: PaginationParameters,
		@Query('with', new ParseRelationIncludePipe(SongQueryParameters.AvailableIncludes)) include: SongQueryParameters.RelationInclude
	): Promise<Song[]> {
		return await this.songService.getSongs({ library: {
			slug: slug
		} }, paginationParameters, include);
	}

	@Get('/:slug/tracks')
	async getTracksByLibrary(
		@Param('slug', ParseSlugPipe) slug: Slug,
		@Query(ParsePaginationParameterPipe) paginationParameters: PaginationParameters,
		@Query('with', new ParseRelationIncludePipe(TrackQueryParameters.AvailableIncludes)) include: TrackQueryParameters.RelationInclude
	): Promise<Track[]> {
		return await this.trackService.getTracks({ byLibrarySource: {
			slug: slug
		} }, paginationParameters, include);
	}
}
