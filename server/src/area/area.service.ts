import { Injectable } from "@nestjs/common";
import { isUUID } from "class-validator";
import { PrismaError } from "prisma-error-enum";
import {
	EventsService,
	ResourceEventPriority,
} from "src/events/events.service";
import { InvalidRequestException } from "src/exceptions/meelo-exception";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";
import Identifier from "src/identifier/models/identifier";
import { Area, Prisma } from "src/prisma/generated/client";
import { AreaWithRelations } from "src/prisma/models";
import PrismaService from "src/prisma/prisma.service";
import { formatIdentifier } from "src/repository/repository.utils";
import Slug from "src/slug/slug";
import {
	AreaAlreadyExistsException,
	AreaNotFoundException,
} from "./area.exceptions";
import AreaQueryParameters from "./area.query-parameters";

@Injectable()
export default class AreaService {
	constructor(
		private prismaService: PrismaService,
		private eventService: EventsService,
	) {}

	async create(input: AreaQueryParameters.CreateInput) {
		const areaSlug = new Slug(input.name);
		const areaSortSlug = new Slug(input.sortName);
		return this.prismaService.area
			.create({
				data: {
					...input,
					slug: areaSlug.toString(),
					sortSlug: areaSortSlug.toString(),
				},
			})

			.then((area) => {
				this.eventService.publishItemCreationEvent(
					"area",
					area.name,
					area.id,
					ResourceEventPriority.Artist,
				);
				return area;
			})
			.catch((error) => {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					if (error.code === PrismaError.UniqueConstraintViolation) {
						throw new AreaAlreadyExistsException(input.name);
					}
				}
				throw new UnhandledORMErrorException(error, input);
			});
	}

	async get(where: AreaQueryParameters.WhereInput) {
		return this.prismaService.area
			.findUniqueOrThrow({
				where: AreaService.formatWhereInput(where),
			})
			.catch((error) => {
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					error.code === PrismaError.RecordsNotFound
				) {
					throw new AreaNotFoundException(where.id ?? where.mbid);
				}
				throw new UnhandledORMErrorException(error, where);
			});
	}

	async getParents(where: AreaQueryParameters.WhereInput): Promise<Area[]> {
		const area = await this.get(where);
		if (area.parentId === null) {
			return [];
		}
		const args = {
			include: this._buildInclude(10),
			where: { id: area.parentId },
		};
		let parentArea: AreaWithRelations | null =
			await this.prismaService.area.findFirstOrThrow<
				Prisma.SelectSubset<
					typeof args,
					Prisma.AreaFindFirstOrThrowArgs
				>
			>(args);
		const parentAreas = [];
		while (parentArea !== null) {
			const { parent, ...area }: AreaWithRelations = parentArea;
			parentAreas.push(area);
			parentArea = parent ?? null;
		}
		return parentAreas;
	}

	private _buildInclude(depth: number): any {
		if (depth < 1) {
			return { parent: true };
		}
		return { parent: { include: this._buildInclude(depth - 1) } };
	}

	static formatWhereInput(
		where: AreaQueryParameters.WhereInput,
	): Prisma.AreaWhereUniqueInput {
		return {
			id: where.id,
			mbid: where.mbid,
		};
	}

	formatSortingInput(
		sortingParameter: AreaQueryParameters.SortingParameter,
	): Prisma.AreaOrderByWithRelationInput[] {
		sortingParameter.order ??= "asc";
		switch (sortingParameter.sortBy) {
			case "name":
				return [{ sortSlug: sortingParameter.order }];
			default:
				return [
					{
						[sortingParameter.sortBy ?? "id"]:
							sortingParameter.order,
					},
				];
		}
	}

	static formatIdentifierToWhereInput(
		identifier: Identifier,
	): AreaQueryParameters.WhereInput {
		return formatIdentifier(identifier, (mbid) => {
			if (isUUID(mbid)) {
				return { mbid };
			}
			throw new InvalidRequestException(
				`Identifier: expected a number or an MBID, got ${identifier}`,
			);
		});
	}
}
