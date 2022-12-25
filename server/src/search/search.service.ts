import { Injectable } from '@nestjs/common';
import type {
	Album, Artist, Genre, Release, Song
} from 'src/prisma/models';
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
import { AlbumType } from '@prisma/client';

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
		include?: ArtistQueryParameters.RelationInclude,
		sort?: ArtistQueryParameters.SortingParameter,
	): Promise<Artist[]> {
		return this.artistService.getAlbumsArtists(
			{ name: { contains: query } },
			paginationParameters,
			include,
			sort
		);
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
		type?: AlbumType,
		paginationParameters?: PaginationParameters,
		include?: AlbumQueryParameters.RelationInclude,
		sort?: AlbumQueryParameters.SortingParameter
	): Promise<Album[]> {
		return this.albumService.getMany(
			{ name: { contains: query }, type: type },
			paginationParameters,
			include,
			sort
		);
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
		include?: SongQueryParameters.RelationInclude,
		sort?: SongQueryParameters.SortingParameter
	): Promise<Song[]> {
		return this.songService.getMany(
			{ name: { contains: query } },
			paginationParameters,
			include,
			sort
		);
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
		include?: ReleaseQueryParameters.RelationInclude,
		sort?: ReleaseQueryParameters.SortingParameter
	): Promise<Release[]> {
		return this.releaseService.getMany(
			{ name: { contains: query } },
			paginationParameters,
			include,
			sort
		);
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
		include?: GenreQueryParameters.RelationInclude,
		sort?: GenreQueryParameters.SortingParameter
	): Promise<Genre[]> {
		return this.genreService.getMany(
			{ name: { contains: query } },
			paginationParameters,
			include,
			sort
		);
	}
}