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
	ResponseType,
> {
	abstract create(input: CreateInput, include?: RelationInput): Promise<EntityType>;
	abstract get(where: WhereInput, include?: RelationInput): Promise<EntityType>;
	abstract select(where: WhereInput, select: Record<'id' & keyof EntityType, boolean | undefined>): Promise<Partial<EntityType>>;
	abstract getMany(where: ManyWhereInput, pagination?: PaginationParameters, include?: RelationInput, sort?: SortInput): Promise<EntityType[]>;
	abstract count(where: ManyWhereInput): Promise<number>;
	abstract update(what: UpdateInput, where: WhereInput): Promise<EntityType>;
	abstract delete(where: DeleteInput): Promise<EntityType>;
	abstract getOrCreate(input: CreateInput, include?: RelationInput): Promise<EntityType>;
	abstract buildResponse(input: EntityType): Promise<ResponseType>;
	protected abstract onNotFound(where: WhereInput): Promise<MeeloException> | MeeloException;
	
	/**
	 * Checks if an entity exists in the database
	 * @param where the query parameters to find the entity
	 * @returns a boolean, true if it exists
	 */
	async exists(where: WhereInput): Promise<boolean> {
		try {
			await this.select(where, { id: true });
			return true;
		} catch {
			return false;
		}
	}
	/**
	 * Throws the exception returned by 'onNotFound' method if the entity does not exist
	 * @param where the query parameters to find the entity
	 */
	async throwIfNotExist(where: WhereInput): Promise<void> {
		await this.select(where, { id: true });
	}
}

export default RepositoryService;