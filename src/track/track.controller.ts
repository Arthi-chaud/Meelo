import { Controller, Get, Query, Param, ParseIntPipe, Response, Post, Body, Inject, forwardRef } from '@nestjs/common';
import AlbumService from 'src/album/album.service';
import IllustrationService from 'src/illustration/illustration.service';
import type { IllustrationDownloadDto } from 'src/illustration/models/illustration-dl.dto';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import Slug from 'src/slug/slug';
import TrackQueryParameters from './models/track.query-parameters';
import TrackService from './track.service';

@Controller('tracks')
export class TrackController {
	constructor(
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => IllustrationService))
		private illustrationService: IllustrationService
	) { }
	
	@Get()
	async getTracks(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude
	) {
		const tracks = await this.trackService.getTracks({}, paginationParameters, include);
		return tracks.map((track) => this.trackService.buildTrackResponse(track));
	}

	@Get(':id')
	async getTrack(
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
		@Param('id', ParseIntPipe)
		trackId: number
	) {
		const track = await this.trackService.getTrack({ id: trackId }, include);
		return this.trackService.buildTrackResponse(track);
	}

	@Get(':id/illustration')
	async getTrackIllustration(
		@Param('id', ParseIntPipe)
		trackId: number,
		@Response({ passthrough: true })
		res: Response
	) {
		let track = await this.trackService.getTrack({ id: trackId }, { release: true });
		let album = await this.albumService.getAlbum({ byId: { id: track.release.albumId } }, { artist: true })
		const trackIllustrationPath = this.illustrationService.buildTrackIllustrationPath(
			new Slug(album.slug),
			new Slug(track.release.slug),
			album.artist ? new Slug(album.artist.slug) : undefined,
			track.discIndex ?? undefined,
			track.trackIndex ?? undefined
		);
		const releaseIllustratioPath = this.illustrationService.buildReleaseIllustrationPath(
			new Slug(album.slug),
			new Slug(track.release.slug),
			album.artist ? new Slug(album.artist.slug) : undefined
		);
		try {
			return this.illustrationService.streamIllustration(
				trackIllustrationPath,
				new Slug(track.displayName).toString(), res
			);
		} catch {
			return this.illustrationService.streamIllustration(
				releaseIllustratioPath,
				new Slug(track.displayName).toString(), res
			);
		}
	}

	@Post('/:id/illustration')
	async updateTrackIllustration(
		@Param('id', ParseIntPipe)
		trackId: number,
		@Body()
		illustrationDto: IllustrationDownloadDto
	) {
		let track = await this.trackService.getTrack({ id: trackId }, { release: true });
		let album = await this.albumService.getAlbum({ byId: { id: track.release.albumId } }, { artist: true })
		const trackIllustrationPath = this.illustrationService.buildTrackIllustrationPath(
			new Slug(album.slug),
			new Slug(track.release.slug),
			album.artist ? new Slug(album.artist.slug) : undefined,
			track.discIndex ?? undefined,
			track.trackIndex ?? undefined
		);
		return await this.illustrationService.downloadIllustration(
			illustrationDto.url,
			trackIllustrationPath
		);
	}
}
