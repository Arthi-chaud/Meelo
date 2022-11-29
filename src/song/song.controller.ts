import {
	Body, Controller, Delete, Get, Inject, Post, Put, Req, forwardRef
} from '@nestjs/common';
import type { Request } from 'express';
import ArtistService from 'src/artist/artist.service';
import ArtistQueryParameters from 'src/artist/models/artist.query-parameters';
import PaginatedResponse from 'src/pagination/models/paginated-response';
import { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import TrackQueryParameters from 'src/track/models/track.query-parameters';
import TrackService from 'src/track/track.service';
import SongQueryParameters from './models/song.query-params';
import ParseSongIdentifierPipe from './song.pipe';
import SongService from './song.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TrackType } from '@prisma/client';
import { LyricsService } from 'src/lyrics/lyrics.service';
import type LyricsDto from 'src/lyrics/models/update-lyrics.dto';
import GenreService from 'src/genre/genre.service';
import GenreQueryParameters from 'src/genre/models/genre.query-parameters';
import { ApiPaginatedResponse } from 'src/pagination/paginated-response.decorator';
import { SongResponse } from './models/song.response';
import { TrackResponse } from 'src/track/models/track.response';
import { GenreResponse } from 'src/genre/models/genre.response';
import { PaginationQuery } from 'src/pagination/pagination-query.decorator';
import { IdentifierParam } from 'src/identifier/identifier-param.decorator';
import RelationIncludeQuery from 'src/relation-include/relation-include-query.decorator';
import SortingQuery from 'src/sort/sort-query.decorator';
import Admin from 'src/roles/admin.decorator';

@ApiTags("Songs")
@Controller('songs')
export class SongController {
	constructor(
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
		@Inject(forwardRef(() => LyricsService))
		private lyricsService: LyricsService,
		@Inject(forwardRef(() => GenreService))
		private genreService: GenreService
	) {}

	@ApiOperation({
		summary: 'Get all songs'
	})
	@ApiPaginatedResponse(SongResponse)
	@Get()
	async getSongs(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(SongQueryParameters.AvailableAtomicIncludes)
		include: SongQueryParameters.RelationInclude,
		@SortingQuery(SongQueryParameters.SortingKeys)
		sortingParameter: SongQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		const songs = await this.songService.getMany(
			{}, paginationParameters, include, sortingParameter
		);

		return PaginatedResponse.awaiting(
			songs.map((song) => this.songService.buildResponse(song)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get a song'
	})
	@Get(':idOrSlug')
	async getSong(
		@RelationIncludeQuery(SongQueryParameters.AvailableAtomicIncludes)
		include: SongQueryParameters.RelationInclude,
		@IdentifierParam(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput
	) {
		const song = await this.songService.get(where, include);

		return this.songService.buildResponse(song);
	}

	@ApiOperation({
		summary: "Increment a song's play count"
	})
	@Put(':idOrSlug/played')
	async incrementSongPlayCount(
		@IdentifierParam(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput
	) {
		await this.songService.incrementPlayCount(where);
		return this.songService.buildResponse(await this.songService.get(where));
	}

	@ApiOperation({
		summary: 'Get a song\'s artist'
	})
	@Get(':idOrSlug/artist')
	async getSongArtist(
		@RelationIncludeQuery(ArtistQueryParameters.AvailableAtomicIncludes)
		include: ArtistQueryParameters.RelationInclude,
		@IdentifierParam(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput
	) {
		const song = await this.songService.get(where);
		const artist = await this.artistService.get({
			id: song.artistId
		}, include);

		return this.artistService.buildResponse(artist);
	}

	@ApiOperation({
		summary: 'Get a song\'s master track'
	})
	@Get(':idOrSlug/master')
	async getSongMaster(
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include: TrackQueryParameters.RelationInclude,
		@IdentifierParam(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput
	) {
		const master = await this.trackService.getMasterTrack(where, include);

		return this.trackService.buildResponse(master);
	}

	@ApiOperation({
		summary: 'Get all the song\'s tracks'
	})
	@Get(':idOrSlug/tracks')
	@ApiPaginatedResponse(TrackResponse)
	async getSongTracks(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include: TrackQueryParameters.RelationInclude,
		@IdentifierParam(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput,
		@SortingQuery(TrackQueryParameters.SortingKeys)
		sortingParameter: TrackQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		const tracks = await this.trackService.getSongTracks(
			where, paginationParameters, include, sortingParameter
		);

		if (tracks.length == 0) {
			await this.songService.throwIfNotFound(where);
		}
		return PaginatedResponse.awaiting(
			tracks.map((track) => this.trackService.buildResponse(track)),
			request
		);
	}

	@ApiOperation({
		summary: "Get a song's versions"
	})
	@ApiPaginatedResponse(SongResponse)
	@Get(':idOrSlug/versions')
	async getSongVersions(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(SongQueryParameters.AvailableAtomicIncludes)
		include: SongQueryParameters.RelationInclude,
		@IdentifierParam(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput,
		@SortingQuery(SongQueryParameters.SortingKeys)
		sortingParameter: SongQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		const versions = await this.songService.getSongVersions(
			where, paginationParameters, include, sortingParameter
		);

		return PaginatedResponse.awaiting(
			versions.map((song) => this.songService.buildResponse(song)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all the song\'s video tracks'
	})
	@ApiPaginatedResponse(TrackResponse)
	@Get(':idOrSlug/videos')
	async getSongVideos(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include: TrackQueryParameters.RelationInclude,
		@SortingQuery(TrackQueryParameters.SortingKeys)
		sortingParameter: TrackQueryParameters.SortingParameter,
		@IdentifierParam(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput,
		@Req() request: Request
	) {
		const videoTracks = await this.trackService.getMany(
			{ bySong: where, type: TrackType.Video },
			paginationParameters,
			include,
			sortingParameter,
		);

		if (videoTracks.length == 0) {
			await this.songService.throwIfNotFound(where);
		}
		return PaginatedResponse.awaiting(
			videoTracks.map((videoTrack) => this.trackService.buildResponse(videoTrack)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all the song\'s genres'
	})
	@ApiPaginatedResponse(GenreResponse)
	@Get(':idOrSlug/genres')
	async getSongGenres(
		@RelationIncludeQuery(GenreQueryParameters.AvailableAtomicIncludes)
		include: GenreQueryParameters.RelationInclude,
		@SortingQuery(GenreQueryParameters.SortingKeys)
		sortingParameter: GenreQueryParameters.SortingParameter,
		@IdentifierParam(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput,
		@Req() request: Request
	) {
		const genres = await this.genreService.getSongGenres(where, include, sortingParameter);

		return PaginatedResponse.awaiting(
			genres.map((genre) => this.genreService.buildResponse(genre)),
			request
		);
	}

	@ApiOperation({
		summary: "Get a song's lyrics"
	})
	@Get(':idOrSlug/lyrics')
	async getSongLyrics(
		@IdentifierParam(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput
	) {
		const lyrics = await this.lyricsService.get({ song: where });

		return this.lyricsService.buildResponse(lyrics);
	}

	@ApiOperation({
		summary: "Update a song's lyrics"
	})
	@Admin()
	@Post(':idOrSlug/lyrics')
	async updateSongLyrics(
		@IdentifierParam(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput,
		@Body() updateLyricsDto: LyricsDto
	) {
		const song = await this.songService.get(where);

		try {
			return await this.lyricsService.update(
				{ content: updateLyricsDto.lyrics },
				{ song: where }
			);
		} catch {
			return this.lyricsService.create({
				songId: song.id, content: updateLyricsDto.lyrics
			});
		}
	}

	@ApiOperation({
		summary: "Delete a song's lyrics"
	})
	@Admin()
	@Delete(':idOrSlug/lyrics')
	async deleteSongLyrics(
		@IdentifierParam(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput
	) {
		const song = await this.songService.get(where);

		await this.lyricsService.delete({ songId: song.id });
	}
}
