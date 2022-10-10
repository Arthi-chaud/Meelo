import { Injectable } from '@nestjs/common';
import type { Album, Artist, Genre, Release, Song } from 'src/prisma/models';
import AlbumService from 'src/album/album.service';
import type AlbumQueryParameters from 'src/album/models/album.query-parameters';
import ArtistService from 'src/artist/artist.service';
import type ArtistQueryParameters from 'src/artist/models/artist.query-parameters';
import GenreService from 'src/genre/genre.service';
import type GenreQueryParameters from 'src/genre/models/genre.query-parameters';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import type ReleaseQueryParameters from 'src/release/models/release.query-parameters';
import ReleaseService from 'src/release/release.service';
import type SongQueryParameters from 'src/song/models/song.query-params';
import SongService from 'src/song/song.service';

@Injectable()
export default class SearchService {
	constructor(
		private artistService: ArtistService,
		private albumService: AlbumService,
		private songService: SongService,
		private releaseService: ReleaseService,
		private genreService: GenreService
	) {}

	/**
	 * Search for artists by their name
	 * @param query the string to search by
	 * @param paginationParameters the pagination of the request
	 * @param include the relation to include with the returned row
	 * @returns An array of artists, matching the string query
	 */
	searchArtists(
		query: string,
		paginationParameters?: PaginationParameters,
		include?: ArtistQueryParameters.RelationInclude
	): Promise<Artist[]> {
		return this.artistService.getAlbumsArtists(
			{ byName: { contains: query } },
			paginationParameters,
			include
		)
	}

	/**
	 * Search for albums by their name
	 * @param query the string to search by
	 * @param paginationParameters the pagination of the request
	 * @param include the relation to include with the returned row
	 * @returns An array of albums, matching the string query
	 */
	searchAlbums(
		query: string,
		paginationParameters?: PaginationParameters,
		include?: AlbumQueryParameters.RelationInclude
	): Promise<Album[]> {
		return this.albumService.getMany(
			{ byName: { contains: query } },
			paginationParameters,
			include
		)
	}

	/**
	 * Search for songs by their name
	 * @param query the string to search by
	 * @param paginationParameters the pagination of the request
	 * @param include the relation to include with the returned row
	 * @returns An array of songs, matching the string query
	 */
	searchSongs(
		query: string,
		paginationParameters?: PaginationParameters,
		include?: SongQueryParameters.RelationInclude
	): Promise<Song[]> {
		return this.songService.getMany(
			{ name: { contains: query } },
			paginationParameters,
			include
		)
	}

	
	/**
	 * Search for releases by their name
	 * @param query the string to search by
	 * @param paginationParameters the pagination of the request
	 * @param include the relation to include with the returned row
	 * @returns An array of releases, matching the string query
	 */
	searchReleases(
		query: string,
		paginationParameters?: PaginationParameters,
		include?: ReleaseQueryParameters.RelationInclude
	): Promise<Release[]> {
		return this.releaseService.getMany(
			{ name: { contains: query } },
			paginationParameters,
			include
		)
	}

	/**
	 * Search for genres by their name
	 * @param query the string to search by
	 * @param paginationParameters the pagination of the request
	 * @param include the relation to include with the returned row
	 * @returns An array of genres, matching the string query
	 */
	searchGenres(
		query: string,
		paginationParameters?: PaginationParameters,
		include?: GenreQueryParameters.RelationInclude
	): Promise<Genre[]> {
		return this.genreService.getMany(
			{ byName: { contains: query } },
			paginationParameters,
			include
		);
	}
}
