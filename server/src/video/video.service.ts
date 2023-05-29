import { Injectable } from '@nestjs/common';
import { PaginationParameters, buildPaginationParameters } from 'src/pagination/models/pagination-parameters';
import PrismaService from 'src/prisma/prisma.service';
import RepositoryService from 'src/repository/repository.service';
import SongQueryParameters from 'src/song/models/song.query-params';
import SongService from 'src/song/song.service';

@Injectable()
export default class VideoService {
	constructor(
		private prismaService: PrismaService,
		private songService: SongService
	) {}

	/**
	 * Get songs with at least one video track
	 * The songs are returned with its first video track
     * @param where the query parameters to find the songs
	 * @param pagination the pagination parameters
	 * @param include the relations to include with the returned songs
	 */
	async getVideos<I extends Omit<SongQueryParameters.RelationInclude, 'tracks'>>(
		where: SongQueryParameters.ManyWhereInput,
		pagination?: PaginationParameters,
		include?: I,
		sort?: SongQueryParameters.SortingParameter
	) {
		return this.prismaService.song.findMany({
			orderBy: sort ? this.songService.formatSortingInput(sort) : undefined,
			include: {
				...RepositoryService.formatInclude(include),
				tracks: {
					where: {
						type: 'Video'
					},
					orderBy: { id: 'asc' },
					take: 1
				}
			},
			...buildPaginationParameters(pagination),
			where: {
				...SongService.formatManyWhereInput(where),
				AND: {
					tracks: {
						some: {
							type: "Video"
						}
					}
				}
			}
		}).then((songs) => songs.map(({ tracks, ...song }) => ({
			...song,
			track: tracks[0]
		})));
	}
}
