import { Controller, forwardRef, Get, Inject, Param, Query } from '@nestjs/common';
import type { Album, Artist } from '@prisma/client';
import IllustrationService from 'src/illustration/illustration.service';
import type { IllustrationPath } from 'src/illustration/models/illustration-path.model';
import type { PaginationParameters } from 'src/pagination/parameters';
import ParsePaginationParameterPipe from 'src/pagination/pipe';
import { ParseArtistSlugPipe, ParseSlugPipe } from 'src/slug/pipe';
import Slug from 'src/slug/slug';
import AlbumService from './album.service';

@Controller('albums')
export default class AlbumController {
	constructor(
		private albumService: AlbumService,
		@Inject(forwardRef(() => IllustrationService))
		private illustrationService: IllustrationService
	) {}

	@Get()
	async getAlbums(
		@Query(ParsePaginationParameterPipe) paginationParameters: PaginationParameters
	) {
		let albums = await this.albumService.getAlbums({}, paginationParameters, { artist: true })
		return albums.map(
			(album) => this.buildAlbumResponse(album)
		);
	}

	@Get('/:artist')
	async getAlbumsByArtist(
		@Query(ParsePaginationParameterPipe) paginationParameters: PaginationParameters,
		@Param('artist', ParseArtistSlugPipe) artistSlug: Slug | undefined
	) {
		let albums = await this.albumService.getAlbums({
			byArtist: artistSlug ? { slug: artistSlug } : undefined
		}, paginationParameters);
		return albums.map(
			(album) => this.buildAlbumResponse(album)
		);
	}

	@Get('/:artist/:album')
	async getAlbum(
		@Param('artist', ParseArtistSlugPipe) artistSlug: Slug | undefined,
		@Param('album', ParseSlugPipe) albumSlug: Slug
	) {
		let album = await this.albumService.getAlbum({
			bySlug: {
				slug: albumSlug,
				artist: artistSlug ? { slug: artistSlug } : undefined
			}
		});
		return this.buildAlbumResponse(album);
	}

	private buildAlbumResponse(album: Album & { artist: Artist | null }) {
		let illustrationPath: IllustrationPath | null = this.illustrationService.buildAlbumIllustrationFolderPath(
			new Slug(album.slug),
			album.artist ? new Slug(album.artist.slug) : undefined
		);
		if (this.illustrationService.illustrationExists(illustrationPath) == false)
			illustrationPath = null;
		return {
			...album,
			illustration: illustrationPath
		}
	}
}