import { Body, Controller, Delete, forwardRef, Get, Inject, Param, Post, Put, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import ArtistService from 'src/artist/artist.service';
import ArtistQueryParameters from 'src/artist/models/artist.query-parameters';
import PaginatedResponse from 'src/pagination/models/paginated-response';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
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
	@Get()
	async getSongs(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', SongQueryParameters.ParseRelationIncludePipe)
		include: SongQueryParameters.RelationInclude,
		@Query(SongQueryParameters.ParseSortingParameterPipe)
		sortingParameter: SongQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		let songs = await this.songService.getMany(
			{}, paginationParameters, include, sortingParameter
		);
		return new PaginatedResponse(
			await Promise.all(songs.map((song) => this.songService.buildResponse(song))),
			request
		);
	}

	@ApiOperation({
		summary: 'Get a song'
	})
	@Get(':idOrSlug')
	async getSong(
		@Query('with', SongQueryParameters.ParseRelationIncludePipe)
		include: SongQueryParameters.RelationInclude,
		@Param(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput
	) {
		let song = await this.songService.get(where, include);
		return await this.songService.buildResponse(song);
	}

	@ApiOperation({
		summary: "Increment a song's play count"
	})
	@Put(':idOrSlug/played')
	async incrementSongPlayCount(
		@Param(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput
	) {
		await this.songService.incrementPlayCount(where);
	}

	@ApiOperation({
		summary: 'Get a song\'s artist'
	})
	@Get(':idOrSlug/artist')
	async getSongArtist(
		@Query('with', ArtistQueryParameters.ParseRelationIncludePipe)
		include: ArtistQueryParameters.RelationInclude,
		@Param(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput
	) {
		let song = await this.songService.get(where);
		let artist = await this.artistService.get({
			id: song.artistId
		}, include);
		return await this.artistService.buildResponse(artist);
	}

	@ApiOperation({
		summary: 'Get a song\'s master track'
	})
	@Get(':idOrSlug/master')
	async getSongMaster(
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
		@Param(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput
	) {
		let master = await this.trackService.getMasterTrack(where, include);
		return await this.trackService.buildResponse(master);
	}

	@ApiOperation({
		summary: 'Get all the song\'s tracks'
	})
	@Get(':idOrSlug/tracks')
	async getSongTracks(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
		@Param(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput,
		@Query(TrackQueryParameters.ParseSortingParameterPipe)
		sortingParameter: TrackQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		let tracks = await this.trackService.getSongTracks(
			where, paginationParameters, include, sortingParameter
		);
		if (tracks.length == 0)
			await this.songService.throwIfNotExist(where);
		return new PaginatedResponse(
			await Promise.all(tracks.map((track) => this.trackService.buildResponse(track))),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all the song\'s video tracks'
	})
	@Get(':idOrSlug/videos')
	async getSongVideos(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
		@Query(TrackQueryParameters.ParseSortingParameterPipe)
		sortingParameter: TrackQueryParameters.SortingParameter,
		@Param(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput,
		@Req() request: Request
	) {
		const videoTracks = await this.trackService.getMany(
			{ bySong: where, type: TrackType.Video }, paginationParameters, include, sortingParameter, 
		);
		if (videoTracks.length == 0)
			await this.songService.throwIfNotExist(where);
		return new PaginatedResponse(
			await Promise.all(videoTracks.map((videoTrack) => this.trackService.buildResponse(videoTrack))),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all the song\'s genres'
	})
	@Get(':idOrSlug/genres')
	async getSongGenres(
		@Query('with', GenreQueryParameters.ParseRelationIncludePipe)
		include: GenreQueryParameters.RelationInclude,
		@Query(GenreQueryParameters.ParseSortingParameterPipe)
		sortingParameter: GenreQueryParameters.SortingParameter,
		@Param(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput,
		@Req() request: Request
	) {
		const genres = await this.genreService.getSongGenres(where, include, sortingParameter);
		return new PaginatedResponse(
			await Promise.all(genres.map((genre) => this.genreService.buildResponse(genre))),
			request
		);
	}

	@ApiOperation({
		summary: "Get a song's lyrics"
	})
	@Get(':idOrSlug/lyrics')
	async getSongLyrics(
		@Param(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput
	) {
		const lyrics = await this.lyricsService.get({ song: where });
		return await this.lyricsService.buildResponse(lyrics);
	}

	@ApiOperation({
		summary: "Update a song's lyrics"
	})
	@Post(':idOrSlug/lyrics')
	async updateSongLyrics(
		@Param(ParseSongIdentifierPipe)
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
			return await this.lyricsService.create({
				songId: song.id, content: updateLyricsDto.lyrics
			});
		}
	}

	@ApiOperation({
		summary: "Delete a song's lyrics"
	})
	@Delete(':idOrSlug/lyrics')
	async deleteSongLyrics(
		@Param(ParseSongIdentifierPipe)
		where: SongQueryParameters.WhereInput
	) {
		const song = await this.songService.get(where);
		await this.lyricsService.delete({ songId: song.id });
	}
}