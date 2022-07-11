import { Body, Controller, DefaultValuePipe, forwardRef, Get, Inject, Param, ParseBoolPipe, ParseIntPipe, Post, Query, Response } from '@nestjs/common';
import AlbumService from 'src/album/album.service';
import AlbumQueryParameters from 'src/album/models/album.query-parameters';
import IllustrationService from 'src/illustration/illustration.service';
import type { IllustrationDownloadDto } from 'src/illustration/models/illustration-dl.dto';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import Slug from 'src/slug/slug';
import SongQueryParameters from 'src/song/models/song.query-params';
import SongService from 'src/song/song.service';
import ArtistService from './artist.service';
import ArtistQueryParameters from './models/artist.query-parameters';

@Controller('artists')
export default class ArtistController {
	constructor(
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		private songService: SongService,
		private illustrationService: IllustrationService
	) {}

	@Get()
	async getArtists(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', ArtistQueryParameters.ParseRelationIncludePipe)
		include: ArtistQueryParameters.RelationInclude,
		@Query('albumArtistOnly', new DefaultValuePipe(false), ParseBoolPipe)
		albumArtistsOnly: boolean = false
	) {
		let artists = await this.artistService.getArtists({}, paginationParameters, include);
		if (albumArtistsOnly) {
			for (const currentArtist of artists) {
				const albumCount = await this.albumService.countAlbums({
					byArtist: { id: currentArtist.id }
				});
				if (albumCount == 0)
					artists = artists.filter((artist) => artist.id != currentArtist.id);
			}
		}
		return artists.map((artist) => this.artistService.buildArtistResponse(artist));
	}

	@Get(':id')
	async getArtist(
		@Param('id', ParseIntPipe)
		artistId: number,
		@Query('with', ArtistQueryParameters.ParseRelationIncludePipe)
		include: ArtistQueryParameters.RelationInclude
	) {
		let artist = await this.artistService.getArtist({ id: artistId }, include);
		return this.artistService.buildArtistResponse(artist);
	}

	@Get(':id/illustration')
	async getArtistIllustration(
		@Param('id', ParseIntPipe)
		artistId: number,
		@Response({ passthrough: true })
		res: Response
	) {
		let artist = await this.artistService.getArtist({ id: artistId });
		return this.illustrationService.streamIllustration(
			this.illustrationService.buildArtistIllustrationPath(new Slug(artist.slug)),
			artist.slug, res
		);
	}

	@Post('/:id/illustration')
	async updateArtistIllustration(
		@Param('id', ParseIntPipe)
		artistId: number,
		@Body()
		illustrationDto: IllustrationDownloadDto
	) {
		let artist = await this.artistService.getArtist({ id: artistId });
		const artistIllustrationPath = this.illustrationService.buildArtistIllustrationPath(new Slug(artist.slug));
		return await this.illustrationService.downloadIllustration(
			illustrationDto.url,
			artistIllustrationPath
		);
	}

	@Get(':id/albums')
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
		return albums.map((album) => this.albumService.buildAlbumResponse(album));
	}

	@Get(':id/songs')
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
		return songs.map((song) => this.songService.buildSongResponse(song));
	}

}
