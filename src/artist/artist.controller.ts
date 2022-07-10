import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import AlbumService from 'src/album/album.service';
import AlbumQueryParameters from 'src/album/models/album.query-parameters';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import SongQueryParameters from 'src/song/models/song.query-params';
import SongService from 'src/song/song.service';
import ArtistService from './artist.service';
import ArtistQueryParameters from './models/artist.query-parameters';

@Controller('artists')
export default class ArtistController {
	constructor(
		private artistService: ArtistService,
		private albumService: AlbumService,
		private songService: SongService
	) {}

	@Get()
	async getArtists(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', ArtistQueryParameters.ParseRelationIncludePipe)
		include: ArtistQueryParameters.RelationInclude
	) {
		let artists = await this.artistService.getArtists({}, paginationParameters, include);
		return artists;
	}

	@Get()
	async getAlbumArtists(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', ArtistQueryParameters.ParseRelationIncludePipe)
		include: ArtistQueryParameters.RelationInclude
	) {
		let artists = await this.artistService.getArtists({}, paginationParameters, include);
		return artists;
	}

	@Get('/:id')
	async getArtist(
		@Param('id', ParseIntPipe)
		artistId: number,
		@Query('with', ArtistQueryParameters.ParseRelationIncludePipe)
		include: ArtistQueryParameters.RelationInclude
	) {
		let artist = await this.artistService.getArtist({ id: artistId }, include);
		return artist;
	}

	@Get('/:id/albums')
	async getArtistAlbums(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Param('id', ParseIntPipe)
		artistId: number,
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude
	) {
		let albums = await this.albumService.getAlbums({
			byArtist: { id: artistId }
		}, paginationParameters, include);
		return albums;
	}

	@Get('/:id/songs')
	async getArtistSongs(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Param('id', ParseIntPipe)
		artistId: number,
		@Query('with', SongQueryParameters.ParseRelationIncludePipe)
		include: SongQueryParameters.RelationInclude
	) {
		let songs = await this.songService.getSongs({
			artist: { id: artistId }
		}, paginationParameters, include);
		return songs;
	}

}
