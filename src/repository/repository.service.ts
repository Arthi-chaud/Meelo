import type { MeeloException } from "src/exceptions/meelo-exception";
import type { PaginationParameters } from "src/pagination/models/pagination-parameters";

/**
 * Base Repository Service Definition 
 */
abstract class RepositoryService<
	EntityType extends { id: number },
	CreateInput,
	WhereInput,
	ManyWhereInput,
	UpdateInput,
	DeleteInput,
	RelationInput,
	SortInput,
	ResponseType extends EntityType,
> {
	abstract create(input: CreateInput, include?: RelationInput): Promise<EntityType>;
	abstract get(where: WhereInput, include?: RelationInput): Promise<EntityType>;
	abstract getMany(where: ManyWhereInput, pagination?: PaginationParameters, include?: RelationInput, sort?: SortInput): Promise<EntityType[]>;
	abstract count(where: ManyWhereInput): Promise<number>;
	abstract update(what: UpdateInput, where: WhereInput): Promise<EntityType>;
	abstract delete(where: DeleteInput): Promise<EntityType>;
	abstract getOrCreate(input: CreateInput, include?: RelationInput): Promise<EntityType>;
	abstract buildResponse(input: EntityType): ResponseType;
	abstract onNotFound(where: WhereInput): MeeloException;
}

export default RepositoryService;