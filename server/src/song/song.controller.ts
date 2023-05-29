import {
	Body, Controller, Delete, Get, Inject, Post, Put, Query, forwardRef
} from '@nestjs/common';
import ArtistService from 'src/artist/artist.service';
import ArtistQueryParameters from 'src/artist/models/artist.query-parameters';
import { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import TrackQueryParameters from 'src/track/models/track.query-parameters';
import TrackService from 'src/track/track.service';
import SongQueryParameters from './models/song.query-params';
import SongService from './song.service';
import {
	ApiOperation, ApiPropertyOptional, ApiTags, IntersectionType
} from '@nestjs/swagger';
import { TrackType } from '@prisma/client';
import { LyricsService } from 'src/lyrics/lyrics.service';
import LyricsDto from 'src/lyrics/models/update-lyrics.dto';
import { SongResponseBuilder } from './models/song.response';
import { TrackResponseBuilder } from 'src/track/models/track.response';
import { PaginationQuery } from 'src/pagination/pagination-query.decorator';
import RelationIncludeQuery from 'src/relation-include/relation-include-query.decorator';
import SortingQuery from 'src/sort/sort-query.decorator';
import Admin from 'src/roles/admin.decorator';
import IdentifierParam from 'src/identifier/identifier.pipe';
import Response, { ResponseType } from 'src/response/response.decorator';
import { ArtistResponseBuilder } from 'src/artist/models/artist.response';
import { LyricsResponseBuilder } from 'src/lyrics/models/lyrics.response';
import { SongWithVideoResponseBuilder } from './models/song-with-video.response';
import { IsOptional } from 'class-validator';
import TransformIdentifier from 'src/identifier/identifier.transform';
import LibraryQueryParameters from 'src/library/models/library.query-parameters';
import LibraryService from 'src/library/library.service';
import GenreQueryParameters from 'src/genre/models/genre.query-parameters';
import GenreService from 'src/genre/genre.service';

class Selector extends IntersectionType(SongQueryParameters.SortingParameter) {
	@IsOptional()
	@ApiPropertyOptional({
		description: 'Filter songs by artist'
	})
	@TransformIdentifier(ArtistService)
	artist?: ArtistQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: 'Filter songs by library'
	})
	@TransformIdentifier(LibraryService)
	library?: LibraryQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: 'Filter songs by genre'
	})
	@TransformIdentifier(GenreService)
	genre?: GenreQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: 'Search songs using a string token'
	})
	query?: string;
}

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
	) { }

	@ApiOperation({
		summary: 'Get many songs'
	})
	@Response({
		handler: SongResponseBuilder,
		type: ResponseType.Page
	})
	@Get()
	async getSongs(
		@Query() selector: Selector,
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(SongQueryParameters.AvailableAtomicIncludes)
		include: SongQueryParameters.RelationInclude
	) {
		if (selector.query) {
			return this.songService.search(
				selector.query,
				selector,
				paginationParameters,
				include,
				selector
			);
		}
		return this.songService.getMany(
			selector,
			paginationParameters,
			include,
			selector
		);
	}

	@ApiOperation({
		summary: 'Get all songs with at least one video.'
	})
	@Response({
		handler: SongWithVideoResponseBuilder,
		type: ResponseType.Page
	})
	@Get('/videos')
	async getVideosByLibrary(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(SongQueryParameters.AvailableAtomicIncludes)
		include: SongQueryParameters.RelationInclude,
		@SortingQuery(SongQueryParameters.SortingKeys)
		sortingParameter: SongQueryParameters.SortingParameter,
	) {
		return this.songService.getSongsWithVideo(
			{ }, paginationParameters, include, sortingParameter
		);
	}

	@ApiOperation({
		summary: 'Get a song'
	})
	@Response({ handler: SongResponseBuilder })
	@Get(':idOrSlug')
	async getSong(
		@RelationIncludeQuery(SongQueryParameters.AvailableAtomicIncludes)
		include: SongQueryParameters.RelationInclude,
		@IdentifierParam(SongService)
		where: SongQueryParameters.WhereInput,
	) {
		return this.songService.get(where, include);
	}

	@ApiOperation({
		summary: "Increment a song's play count"
	})
	@Response({ handler: SongResponseBuilder })
	@Put(':idOrSlug/played')
	async incrementSongPlayCount(
		@IdentifierParam(SongService)
		where: SongQueryParameters.WhereInput,
	) {
		await this.songService.incrementPlayCount(where);
		return this.songService.get(where);
	}

	@ApiOperation({
		summary: 'Get a song\'s artist'
	})
	@Response({ handler: ArtistResponseBuilder })
	@Get(':idOrSlug/artist')
	async getSongArtist(
		@RelationIncludeQuery(ArtistQueryParameters.AvailableAtomicIncludes)
		include: ArtistQueryParameters.RelationInclude,
		@IdentifierParam(SongService)
		where: SongQueryParameters.WhereInput,
	) {
		const song = await this.songService.get(where);

		return this.artistService.get({
			id: song.artistId
		}, include);
	}

	@ApiOperation({
		summary: 'Get a song\'s master track'
	})
	@Response({ handler: TrackResponseBuilder })
	@Get(':idOrSlug/master')
	async getSongMaster(
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include: TrackQueryParameters.RelationInclude,
		@IdentifierParam(SongService)
		where: SongQueryParameters.WhereInput,
	) {
		return this.trackService.getMasterTrack(where, include);
	}

	@ApiOperation({
		summary: 'Get all the song\'s tracks'
	})
	@Get(':idOrSlug/tracks')
	@Response({
		handler: TrackResponseBuilder,
		type: ResponseType.Page
	})
	async getSongTracks(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include: TrackQueryParameters.RelationInclude,
		@SortingQuery(TrackQueryParameters.SortingKeys)
		sortingParameter: TrackQueryParameters.SortingParameter,
		@IdentifierParam(SongService)
		where: SongQueryParameters.WhereInput
	) {
		const tracks = await this.trackService.getSongTracks(
			where, paginationParameters, include, sortingParameter
		);

		if (tracks.length == 0) {
			await this.songService.throwIfNotFound(where);
		}
		return tracks;
	}

	@ApiOperation({
		summary: "Get a song's versions"
	})
	@Response({
		handler: SongResponseBuilder,
		type: ResponseType.Page
	})
	@Get(':idOrSlug/versions')
	async getSongVersions(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(SongQueryParameters.AvailableAtomicIncludes)
		include: SongQueryParameters.RelationInclude,
		@SortingQuery(SongQueryParameters.SortingKeys)
		sortingParameter: SongQueryParameters.SortingParameter,
		@IdentifierParam(SongService)
		where: SongQueryParameters.WhereInput
	) {
		return this.songService.getSongVersions(
			where, paginationParameters, include, sortingParameter
		);
	}

	@ApiOperation({
		summary: 'Get all the song\'s video tracks'
	})
	@Response({
		handler: TrackResponseBuilder,
		type: ResponseType.Page
	})
	@Get(':idOrSlug/videos')
	async getSongVideos(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(TrackQueryParameters.AvailableAtomicIncludes)
		include: TrackQueryParameters.RelationInclude,
		@SortingQuery(TrackQueryParameters.SortingKeys)
		sortingParameter: TrackQueryParameters.SortingParameter,
		@IdentifierParam(SongService)
		where: SongQueryParameters.WhereInput
	) {
		const videoTracks = await this.trackService.getMany(
			{ song: where, type: TrackType.Video },
			paginationParameters,
			include,
			sortingParameter,
		);

		if (videoTracks.length == 0) {
			await this.songService.throwIfNotFound(where);
		}
		return videoTracks;
	}

	@ApiOperation({
		summary: "Get a song's lyrics"
	})
	@Get(':idOrSlug/lyrics')
	@Response({ handler: LyricsResponseBuilder })
	async getSongLyrics(
		@IdentifierParam(SongService)
		where: SongQueryParameters.WhereInput,
	) {
		return this.lyricsService.get({ song: where });
	}

	@ApiOperation({
		summary: "Update a song's lyrics"
	})
	@Admin()
	@Response({ handler: LyricsResponseBuilder })
	@Post(':idOrSlug/lyrics')
	async updateSongLyrics(
		@IdentifierParam(SongService)
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
		@IdentifierParam(SongService)
		where: SongQueryParameters.WhereInput,
	) {
		const song = await this.songService.get(where);

		await this.lyricsService.delete({ songId: song.id });
	}
}
