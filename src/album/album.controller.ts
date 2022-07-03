import { Controller, forwardRef, Get, Inject, Param } from '@nestjs/common';
import type { Album, Artist } from '@prisma/client';
import IllustrationService from 'src/illustration/illustration.service';
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
	async getAlbums() {
		let albums = await this.albumService.getAlbums({}, {}, { artist: true })
		return albums.map(
			(album) => this.buildAlbumResponse(album)
		);
	}

	@Get('/:artist')
	async getAlbumsByArtist(
		@Param('artist', ParseArtistSlugPipe) artistSlug: Slug | undefined) {
		let albums = await this.albumService.getAlbums({
			byArtist: artistSlug ? { slug: artistSlug } : undefined
		});
		return albums.map(
			(album) => this.buildAlbumResponse(album)
		);
	}

	@Get('/:artist/:album')
	async getAlbum(
		@Param('artist', ParseArtistSlugPipe) artistSlug: Slug | undefined,
		@Param('album', ParseSlugPipe) albumSlug: Slug) {
		let album = await this.albumService.getAlbum({
			bySlug: {
				slug: albumSlug,
				artist: artistSlug ? { slug: artistSlug } : undefined
			}
		});
		return this.buildAlbumResponse(album);
	}

	private buildAlbumResponse(album: Album & { artist: Artist | null }) {
		const illustration = this.illustrationService.buildAlbumIllustrationFolderPath(
			new Slug(album.slug),
			album.artist ? new Slug(album.artist.slug) : undefined
		);
		return {
			...album,
			illustration
		}
	}
}