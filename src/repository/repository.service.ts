import type { MeeloException } from "src/exceptions/meelo-exception";
import { buildPaginationParameters, PaginationParameters } from "src/pagination/models/pagination-parameters";
import { buildSortingParameter } from "src/sort/models/sorting-parameter";
type ModelSelector<T extends {}> = Partial<Record<keyof T, boolean>>;

/**
 * Selects the fields to include, except relation fields
 */
type Select<T extends {}, Selector extends ModelSelector<T>> = Omit<
	T,
	keyof {
		[key in keyof T as key extends keyof Selector
		? Selector[key] extends true ? never : key
		: key
		]: key
	}
>
/**
 * Type definition of a method that returns only one item
 * The fields of the items can be selected.
 * Or the methods can return related entities
 */
type ORMGetterMethod<
	Model extends { id: number },
	ModelRelations extends {},
	AdditionalParams extends {}
> = <
	Params extends AdditionalParams,
	ReturnType extends Model = Params extends { include: infer RelationSelection }
		? RelationSelection extends ModelSelector<ModelRelations>
			? Model & Select<ModelRelations, RelationSelection>
			: Model
		: Model
>(args: Params) => Promise<Model | ReturnType>;

/**
 * Type definition of a method that returns multiple item items
 */
type ORMManyGetterMethod<
	Model extends { id: number },
	ModelRelations extends {},
	AdditionalParams extends {}
> = <
 Params extends AdditionalParams & { take?: number, skip?: number },
 ReturnType extends Model = Params extends { include: infer RelationSelection }
	 ? RelationSelection extends ModelSelector<ModelRelations>
		 ? Model & Select<ModelRelations, RelationSelection>
		 : Model
	 : Model
>(args: Params) => Promise<(Model | ReturnType)[]>;


/**
 * Base Repository Service Definition 
 */
abstract class RepositoryService<
	Model extends { id: number },
	ModelRelations extends {},
	CreateInput,
	WhereInput,
	ManyWhereInput,
	UpdateInput,
	DeleteInput,
	RepositoryCreateInput,
	RepositoryWhereInput,
	RepositoryManyWhereInput,
	RepositoryUpdateInput,
	RepositoryDeleteInput
> {
	constructor(protected repository: {
		create: ORMGetterMethod<Model, ModelRelations, { data: RepositoryCreateInput }>,
		findFirst: ORMGetterMethod<Model, ModelRelations, { where: RepositoryWhereInput, rejectOnNotFound: true }>
		findMany: ORMManyGetterMethod<Model, ModelRelations, { where: RepositoryManyWhereInput }>
		delete: (args: { where: RepositoryDeleteInput }) => Promise<Model>,
		update: (args: { where: RepositoryWhereInput, data: RepositoryUpdateInput }) => Promise<Model>
		count: (args: { where: RepositoryManyWhereInput }) => Promise<number>,
	}) {}

	async create<I extends ModelSelector<ModelRelations>>(input: CreateInput, include?: I) {
		try {
			return await this.repository.create({
				rejectOnNotFound: true,
				data: this.formatCreateInput(input),
				include: RepositoryService.formatInclude(include)
			}) as Model & Select<ModelRelations, I>;
		} catch {
			throw await this.onCreationFailure(input);
		}
	}
	abstract formatCreateInput(input: CreateInput): RepositoryCreateInput;
	protected abstract onCreationFailure(input: CreateInput): Promise<MeeloException> | MeeloException;
	protected abstract formatCreateInputToWhereInput(input: CreateInput): WhereInput;

	async get<I extends ModelSelector<ModelRelations>>(where: WhereInput, include?: I) {
		this.checkWhereInputIntegrity(where);
		try {
			return await this.repository.findFirst({
				rejectOnNotFound: true,
				where: this.formatWhereInput(where),
				include: RepositoryService.formatInclude(include)
			}) as Model & Select<ModelRelations, I>;
		} catch (e) {
			throw await this.onNotFound(where);
		}
	}
	checkWhereInputIntegrity(_input: WhereInput) {}
	abstract formatWhereInput(input: WhereInput): RepositoryWhereInput;
	abstract onNotFound(where: WhereInput): Promise<MeeloException> | MeeloException;

	async select<S extends ModelSelector<Model>>(where: WhereInput, select: S): Promise<Select<Model, S>> {
		this.checkWhereInputIntegrity(where);
		try {
			return await this.repository.findFirst({
				rejectOnNotFound: true,
				where: this.formatWhereInput(where),
				select: { ...select,  id: true }
			});
		} catch {
			throw await this.onNotFound(where);
		}
	}

	async getMany<I extends ModelSelector<ModelRelations>, S extends { sortBy: string, order?: 'asc' | 'desc' }>(
		where: ManyWhereInput,
		pagination?: PaginationParameters,
		include?: I,
		sort?: S
	){
		return this.repository.findMany({
			where: this.formatManyWhereInput(where),
			include: RepositoryService.formatInclude(include),
			orderBy: buildSortingParameter(sort),
			...buildPaginationParameters(pagination) 
		}) as Promise<(Model & Select<ModelRelations, I>)[]>;
	}
	abstract formatManyWhereInput(input: ManyWhereInput): RepositoryManyWhereInput;

	async count(where: ManyWhereInput): Promise<number> {
		return this.repository.count({
			where: this.formatManyWhereInput(where)
		});
	}

	async update(what: UpdateInput, where: WhereInput): Promise<Model> {
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
	abstract formatUpdateInput(what: UpdateInput): RepositoryUpdateInput;
	async onUpdateFailure(_what: UpdateInput, where: WhereInput): Promise<MeeloException> {
		return await this.onNotFound(where);
	}

	async delete(where: DeleteInput): Promise<Model> {
		try {
			return await this.repository.delete({
				where: this.formatDeleteInput(where)
			});
		} catch {
			throw await this.onDeletionFailure(where);
		}
	}
	abstract formatDeleteInput(where: DeleteInput): RepositoryDeleteInput;
	protected abstract formatDeleteInputToWhereInput(input: DeleteInput): WhereInput;
	async onDeletionFailure(where: DeleteInput): Promise<MeeloException> {
		return await this.onNotFound(this.formatDeleteInputToWhereInput(where));
	}

	async getOrCreate<I extends ModelSelector<ModelRelations>>(input: CreateInput, include?: I) {
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

	abstract buildResponse(input: Model & Partial<ModelRelations>): unknown;
	static formatInclude<I extends ModelSelector<Relations>, Relations extends {}>(include?: I) {
		if (include === undefined)
			return include;
		if (Object.keys(include).length == 0)
			return undefined;
		return include;
	}
}

export default RepositoryService;