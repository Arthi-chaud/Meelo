import { Body, Controller, DefaultValuePipe, Get, Param, ParseBoolPipe, ParseIntPipe, Post, Query, Response } from '@nestjs/common';
import type { Artist } from '@prisma/client';
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
		private artistService: ArtistService,
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
			let albumArtists: Artist[] = [];
			for (const artist of artists) {
				const albumCount = await this.albumService.countAlbums({ byArtist: { id: artist.id } });
				if (albumCount !== 0)
					albumArtists.push(artist);
			}
			return albumArtists;
		}
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

	@Get('/:id/illustration')
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
