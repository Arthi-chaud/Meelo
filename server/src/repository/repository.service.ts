/* eslint-disable @typescript-eslint/ban-types */
import { InvalidRequestException, MeeloException } from "src/exceptions/meelo-exception";
import Identifier from "src/identifier/models/identifier";
import { PaginationParameters, buildPaginationParameters } from "src/pagination/models/pagination-parameters";
import SortingParameter from "src/sort/models/sorting-parameter";
import type { Primitive } from "type-fest";

type AtomicModel = { id: number };

type ModelSelector<T extends {}> = Partial<Record<keyof T, boolean>>;

/**
 * Selects the fields to include, except relation fields
 */
type Select<T extends {}, Selector extends ModelSelector<T>> = Pick<
	T,
	keyof {
		[key in keyof T as key extends keyof Selector
			? Selector[key] extends true ? key : never
			: never
		]: T[key]
	}
>

/**
 * Extract Relation fields from an entity object
 */
type ModelRelations<T extends AtomicModel> = Required<Omit<
	T,
	keyof {
		[key in keyof T as T[key] extends Primitive | Date ? key : never]: key
	}
>>

/**
 * Extract Base fields from an entity object
 */
type Base<T extends AtomicModel> = AtomicModel & Omit<T, keyof ModelRelations<T>>

/**
 * Type definition of a method that returns only one item
 * The fields of the items can be selected.
 * Or the methods can return related entities
 */
type ORMGetterMethod<
	Model extends AtomicModel,
	Relations extends {},
	AdditionalParams extends {}
> = <
	Params extends AdditionalParams,
	ReturnType extends Model = Params extends { include: infer RelationSelection }
		? RelationSelection extends ModelSelector<Relations>
			? Model & Select<Relations, RelationSelection>
			: Model
		: Model
>(args: Params) => Promise<Model | ReturnType>;

/**
 * Type definition of a method that returns multiple item items
 */
type ORMManyGetterMethod<
	Model extends AtomicModel,
	Relations extends {},
	AdditionalParams extends {}
> = <
	Params extends AdditionalParams & { take?: number, skip?: number },
	ReturnType extends Model = Params extends { include: infer RelationSelection }
		? RelationSelection extends ModelSelector<Relations>
			? Model & Select<Relations, RelationSelection>
			: Model
		: Model
>(args: Params) => Promise<(Model | ReturnType)[]>;

/**
 * Base Repository Service Definition
 */
abstract class RepositoryService<
	Model extends AtomicModel,
	CreateInput,
	WhereInput,
	ManyWhereInput,
	UpdateInput,
	DeleteInput,
	SortingKeys extends readonly string[],
	RepositoryCreateInput,
	RepositoryWhereInput,
	RepositoryManyWhereInput,
	RepositoryUpdateInput,
	RepositoryDeleteInput,
	RepositorySortingInput,
	BaseModel extends AtomicModel = Base<Model>,
	Relations extends ModelRelations<Model> = ModelRelations<Model>
> {
	constructor(protected repository: {
		create: ORMGetterMethod<BaseModel, Relations, { data: RepositoryCreateInput }>,
		findFirstOrThrow: ORMGetterMethod<BaseModel, Relations, { where: RepositoryWhereInput }>
		findMany: ORMManyGetterMethod<BaseModel, Relations, { where: RepositoryManyWhereInput }>
		delete: (args: { where: RepositoryDeleteInput }) => Promise<BaseModel>,
		update: (args: {
			where: RepositoryWhereInput, data: RepositoryUpdateInput
		}) => Promise<BaseModel>
		count: (args: { where: RepositoryManyWhereInput }) => Promise<number>,
	}) {}

	/**
	 * Creates an entity in the database
	 * @param input the parameters to create an entity
	 * @param include the relations to include with the returned entity
	 * @returns the newly-created entity
	 */
	async create<I extends ModelSelector<Relations>>(input: CreateInput, include?: I) {
		try {
			return await this.repository.create({
				data: this.formatCreateInput(input),
				include: RepositoryService.formatInclude(include)
			}) as BaseModel & Select<Relations, I>;
		} catch {
			throw await this.onCreationFailure(input);
		}
	}

	/**
	 * Formats input into ORM-compatible parameter
	 * @param input the ceation parameter passed to `create`
	 */
	abstract formatCreateInput(input: CreateInput): RepositoryCreateInput;
	/**
	 * @return an enxception to throw if the entity's creation failed
	 */
	protected abstract onCreationFailure(
		input: CreateInput
	): Promise<MeeloException> | MeeloException;

	/**
	 * Transform CreationInput into WhereInput
	 */
	protected abstract formatCreateInputToWhereInput(input: CreateInput): WhereInput;

	/**
	 * Find an entity in the database
	 * @param where the query parameters to find an entity
	 * @param include the relation fields to include with the returned entity
	 * @returns The entity matching the query parameters
	 */
	async get<I extends ModelSelector<Relations>>(where: WhereInput, include?: I) {
		this.checkWhereInputIntegrity(where);
		try {
			return await this.repository.findFirstOrThrow({
				where: this.formatWhereInput(where),
				include: RepositoryService.formatInclude(include)
			}) as BaseModel & Select<Relations, I>;
		} catch {
			throw await this.onNotFound(where);
		}
	}

	/**
	 * Format an Identifier into a WhereInput
	 * @param identifier the entity unique identifier
	 * @param stringToWhereInput the methods to turn string identifier into a WhereInput
	 * @param numberToWhereInput the methods to turn numeric identifier into a WhereInput
	 * @returns a WhereInput
	 */
	protected static formatIdentifier<RepoWhereInput>(
		identifier: Identifier,
		stringToWhereInput: (id: string) => RepoWhereInput,
		numberToWhereInput?: (id: number) => RepoWhereInput
	): RepoWhereInput {
		if (typeof identifier == 'number') {
			if (numberToWhereInput) {
				return numberToWhereInput(identifier);
			}
			return RepositoryService.formatNumberIdentifierToWhereInput(identifier);
		}
		return stringToWhereInput(identifier);
	}

	/**
	 * Format numberic identifier into WhereInput
	 */
	static formatNumberIdentifierToWhereInput<RepoWhereInput>(
		identifier: number
	): RepoWhereInput {
		return <RepoWhereInput>{ id: identifier };
	}

	/**
	 * Fallback method to assign to `formatIdentifierToWhereInput` if no handling of string identifier is possible
	 */
	protected static UnexpectedStringIdentifier = (identifier: string): never => {
		throw new InvalidRequestException(`Identifier: expected a number, got ${identifier}`);
	};

	/**
	 * Checks if the Query parameters to find an entity are consistent
	 * If it is not, it should throw.
	 */
	checkWhereInputIntegrity(_input: WhereInput) {
		return;
	}

	/**
	 * Formats input into ORM-compatible parameter
	 * @param input the ceation parameter passed to `get`
	 */
	abstract formatWhereInput(input: WhereInput): RepositoryWhereInput;
	/**
	 * @return an exception to throw if fetch failed
	 */
	abstract onNotFound(where: WhereInput): Promise<MeeloException> | MeeloException;

	/**
	 * Find an entity in the database, and select fields
	 * @param where the query parameters to find an entity
	 * @param select the fields to fetch
	 * @returns The entity matching the query parameters
	 */
	async select<S extends ModelSelector<BaseModel>>(
		where: WhereInput, select: S
	): Promise<Select<BaseModel, S>> {
		this.checkWhereInputIntegrity(where);
		try {
			return await this.repository.findFirstOrThrow({
				where: this.formatWhereInput(where),
				select: { ...select, id: true }
			});
		} catch {
			throw await this.onNotFound(where);
		}
	}

	/**
	 * Find multiple entities
	 * @param where the query parameters to find entities
	 * @param pagination the pagination parameters
	 * @param include the relation fields to include with the returned entities
	 * @param sort the sorting parameters
	 * @returns matching entities
	 */
	async getMany<I extends ModelSelector<Relations>>(
		where: ManyWhereInput,
		pagination?: PaginationParameters,
		include?: I,
		sort?: SortingParameter<SortingKeys>
	){
		return this.repository.findMany({
			where: this.formatManyWhereInput(where),
			include: RepositoryService.formatInclude(include),
			orderBy: sort ? this.formatSortingInput(sort) : undefined,
			...buildPaginationParameters(pagination)
		}) as Promise<(BaseModel & Select<Relations, I>)[]>;
	}

	/**
	 * Formats input into ORM-compatible parameter
	 * @param input the ceation parameter passed to `getMany`
	 */
	abstract formatManyWhereInput(input: ManyWhereInput): RepositoryManyWhereInput;

	/**
	 * Format input into ORM-compatible parameter
	 */
	abstract formatSortingInput(
		sortingParameter: SortingParameter<SortingKeys>
	): RepositorySortingInput

	/**
	 * Count entities matching the query parameters
	 * @param where the query parameters
	 * @returns the number of matching entities
	 */
	async count(where: ManyWhereInput): Promise<number> {
		return this.repository.count({
			where: this.formatManyWhereInput(where)
		});
	}

	/**
	 * Updates an entity in the database
	 * @param what the fields to update
	 * @param where the query parameters to find the entity to update
	 * @returns the updated entity
	 */
	async update(what: UpdateInput, where: WhereInput): Promise<BaseModel> {
		this.checkWhereInputIntegrity(where);
		try {
			return await this.repository.update({
				data: this.formatUpdateInput(what),
				where: this.formatWhereInput(where)
			});
		} catch {
			throw await this.onUpdateFailure(what, where);
		}
	}

	/**
	 * Formats input into ORM-compatible parameter
	 * @param what the ceation parameter passed to `update`
	 */
	abstract formatUpdateInput(what: UpdateInput): RepositoryUpdateInput;
	/**
	 * @return an exception to throw if update failed
	 */
	async onUpdateFailure(_what: UpdateInput, where: WhereInput): Promise<MeeloException> {
		return this.onNotFound(where);
	}

	/**
	 * Delete an entity
	 * @param where the query parameters to find an entity
	 * @returns
	 */
	async delete(where: DeleteInput): Promise<BaseModel> {
		try {
			return await this.repository.delete({
				where: this.formatDeleteInput(where)
			});
		} catch {
			throw await this.onDeletionFailure(where);
		}
	}

	/**
	 * Formats input into ORM-compatible parameter
	 * @param where the ceation parameter passed to `delete`
	 */
	abstract formatDeleteInput(where: DeleteInput): RepositoryDeleteInput;
	/**
	 * Transform CreationInput into WhereInput
	 */
	protected abstract formatDeleteInputToWhereInput(input: DeleteInput): WhereInput;
	/**
	 * @return an exception to throw if deletion failed
	 */
	async onDeletionFailure(where: DeleteInput): Promise<MeeloException> {
		return this.onNotFound(this.formatDeleteInputToWhereInput(where));
	}

	/**
	 * Fetch an entity, or create one if it does not exist
	 * @param input the creation input
	 * @param include the relation fields to include with the returned entity
	 * @returns the matching entity
	 */
	async getOrCreate<I extends ModelSelector<Relations>>(input: CreateInput, include?: I) {
		try {
			return await this.get(this.formatCreateInputToWhereInput(input), include);
		} catch {
			return this.create(input, include);
		}
	}

	/**
	 * Checks if an entity exists in the database
	 * @param where the query parameters to find the entity
	 * @returns a boolean, true if it exists
	 */
	async exists(where: WhereInput): Promise<boolean> {
		try {
			await this.select(where, { });
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Throws the exception returned by 'onNotFound' method if the entity does not exist
	 * @param where the query parameters to find the entity
	 */
	async throwIfNotFound(where: WhereInput): Promise<void> {
		await this.select(where, { });
	}

	abstract buildResponse(input: Model): unknown;
	static formatInclude<I extends ModelSelector<Relation>, Relation extends {}>(include?: I) {
		if (include === undefined) {
			return include;
		}
		if (Object.keys(include).length == 0) {
			return undefined;
		}
		return include;
	}
}

export default RepositoryService;