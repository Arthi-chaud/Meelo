import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { Meilisearch } from "meilisearch";
import { InjectMeiliSearch } from "nestjs-meilisearch";
import { PrismaError } from "prisma-error-enum";
import AlbumService from "src/album/album.service";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import {
	EventsService,
	ResourceEventPriority,
} from "src/events/events.service";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";
import LabelService from "src/label/label.service";
import Logger from "src/logger/logger";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import { Prisma } from "src/prisma/generated/client";
import PrismaService from "src/prisma/prisma.service";
import {
	formatIdentifierToIdOrSlug,
	formatPaginationParameters,
} from "src/repository/repository.utils";
import SearchableRepositoryService from "src/repository/searchable-repository.service";
import Slug from "src/slug/slug";
import {
	SeriesAlreadyExistsException,
	SeriesNotFoundException,
} from "./series.exception";
import SeriesQueryParameters from "./series.query-parameters";

@Injectable()
export class SeriesService extends SearchableRepositoryService {
	private readonly logger: Logger = new Logger(SeriesService.name);
	constructor(
		@InjectMeiliSearch() protected readonly meiliSearch: Meilisearch,
		private readonly prismaService: PrismaService,
		private eventService: EventsService,
		private labelService: LabelService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
	) {
		super("series", ["name", "slug"], meiliSearch);
	}

	async getOrCreate(data: SeriesQueryParameters.CreateInput) {
		const seriesSlug = new Slug(data.name);
		try {
			return await this.get({ slug: seriesSlug });
		} catch {
			return await this.create(data);
		}
	}

	async create(input: SeriesQueryParameters.CreateInput) {
		const seriesSlug = new Slug(input.name);
		return this.prismaService.series
			.create({
				data: {
					name: input.name,
					mbid: input.mbid,
					slug: seriesSlug.toString(),
				},
			})
			.catch((error) => {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === PrismaError.UniqueConstraintViolation) {
						throw new SeriesAlreadyExistsException(seriesSlug);
					}
				}
				throw new UnhandledORMErrorException(error, input);
			})
			.then((series) => {
				this.meiliSearch.index(this.indexName).addDocuments([
					{
						id: series.id,
						slug: series.slug,
						name: series.name,
					},
				]);
				this.eventService.publishItemCreationEvent(
					"series",
					series.name,
					series.id,
					ResourceEventPriority.Series,
				);
				return series;
			});
	}

	async get<I extends SeriesQueryParameters.RelationInclude = {}>(
		where: SeriesQueryParameters.WhereInput,
		include?: I,
	) {
		return this.prismaService.series
			.findUniqueOrThrow({
				where: SeriesService.formatWhereInput(where),
				include: include ?? ({} as I),
			})
			.catch((error) => {
				throw this.onNotFound(error, where);
			});
	}

	async getMany<I extends SeriesQueryParameters.RelationInclude = {}>(
		sort?: SeriesQueryParameters.SortingParameter,
		pagination?: PaginationParameters,
		include?: I,
	) {
		return this.prismaService.series.findMany({
			include: include ?? ({} as I),
			orderBy:
				sort === undefined ? undefined : this.formatSortingInput(sort),
			...formatPaginationParameters(pagination),
		});
	}

	formatSortingInput(
		sortingParameter: SeriesQueryParameters.SortingParameter,
	): Prisma.SeriesOrderByWithRelationInput[] {
		sortingParameter.order ??= "asc";
		switch (sortingParameter.sortBy) {
			case "name":
				return [{ slug: sortingParameter.order }];
			case "albumCount":
				return [
					{ entries: { _count: sortingParameter.order } },
					{ slug: "asc" },
				];
			case "addDate":
				return [
					{ registeredAt: sortingParameter.order },
					{ slug: "asc" },
				];
			default:
				return [
					{
						[sortingParameter.sortBy ?? "id"]:
							sortingParameter.order,
					},
				];
		}
	}

	onNotFound(error: Error, where: SeriesQueryParameters.WhereInput) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === PrismaError.RecordsNotFound
		) {
			if (where.id !== undefined) {
				return new SeriesNotFoundException(where.id);
			}
			return new SeriesNotFoundException(where.slug);
		}
		return new UnhandledORMErrorException(error, where);
	}

	static formatWhereInput(
		where: SeriesQueryParameters.WhereInput,
	): Prisma.SeriesWhereUniqueInput {
		return {
			id: where.id,
			slug: where.slug?.toString(),
		};
	}

	async update(
		what: SeriesQueryParameters.UpdateInput,
		where: SeriesQueryParameters.WhereInput,
	) {
		if (what.labelId) {
			await this.labelService.get({ id: what.labelId });
		}
		return this.prismaService.series
			.update({
				data: what,
				where: SeriesService.formatWhereInput(where),
			})
			.catch(async (error) => {
				throw this.onNotFound(error, where);
			});
	}

	async addEntry(
		album: AlbumQueryParameters.WhereInput,
		series: SeriesQueryParameters.WhereInput,
		index: number,
	) {
		const { id: albumId } = await this.albumService.get(album);
		const { id: seriesId } = await this.get(series);
		await this.prismaService.seriesEntry.upsert({
			where: { seriesId_albumId: { seriesId, albumId } },
			create: { seriesId, albumId, index },
			update: { index },
		});
	}

	async housekeeping() {
		const { count: deletedCount } =
			await this.prismaService.series.deleteMany({
				where: { entries: { none: {} } },
			});
		if (deletedCount > 0) {
			this.logger.warn(`Deleted ${deletedCount} series`);
		}
	}

	static formatIdentifierToWhereInput = formatIdentifierToIdOrSlug;
}
