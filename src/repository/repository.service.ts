// import type { MeeloException } from "src/exceptions/meelo-exception";
// import type PrismaService from "src/prisma/prisma.service";

// abstract class RepositoryService<
// 	EntityType extends { id: number },
// 	CreateInput extends RepositoryInput,
// 	WhereInput extends RepositoryInput,
// 	ManyWhereInput extends RepositoryInput,
// 	UpdateInput extends RepositoryInput,
// 	DeleteInput extends RepositoryInput,
// 	ResponseType extends EntityType
// > {
// 	constructor(protected prismaService: PrismaService) {}

// 	abstract create(input: CreateInput): Promise<EntityType>;
// 	abstract get(where: WhereInput): Promise<EntityType>;
// 	abstract getMany(where: ManyWhereInput): Promise<EntityType[]>;
// 	abstract count(where: ManyWhereInput): Promise<number>;
// 	abstract update(what: UpdateInput, where: WhereInput): Promise<EntityType>;
// 	abstract delete(where: DeleteInput): Promise<EntityType>;
// 	abstract getOrCreate(input: CreateInput): Promise<EntityType>;
// 	abstract buildResponse(input: EntityType): ResponseType;
// 	abstract onNotFound(where: WhereInput): MeeloException;
// }

// export default RepositoryService;