import { Injectable } from '@nestjs/common';
import RepositoryService from 'src/repository/repository.service';
import type { User } from 'src/prisma/models';
import type { Prisma } from '@prisma/client';
import type UserQueryParameters from './models/user.query-params';
import PrismaService from 'src/prisma/prisma.service';
import { MeeloException } from 'src/exceptions/meelo-exception';
import SortingParameter from 'src/sort/models/sorting-parameter';
import bcrypt from 'bcrypt';
import UserResponse from './models/user.response';
import { UserAlreadyExistsException, UserNotFoundException, UserNotFoundFromCredentialsException, UserNotFoundFromIDException } from './user.exceptions';

@Injectable()
export default class UserService extends RepositoryService<
	User,
	UserQueryParameters.CreateInput,
	UserQueryParameters.WhereInput,
	UserQueryParameters.ManyWhereInput,
	UserQueryParameters.UpdateInput,
	UserQueryParameters.DeleteInput,
	[],
	Prisma.UserCreateInput,
	Prisma.UserWhereInput,
	Prisma.UserWhereInput,
	Prisma.UserUpdateInput,
	Prisma.UserWhereUniqueInput,
	Prisma.UserOrderByWithRelationInput
> {

	private readonly passwordHashSaltRound = 9;
	
	constructor(
		protected prismaService: PrismaService
	) {
		super(prismaService.user);
	}

	private encryptPassword(plainTextPassword: string): string {
		return bcrypt.hashSync(plainTextPassword, this.passwordHashSaltRound);
	}

	formatCreateInput(input: UserQueryParameters.CreateInput): Prisma.UserCreateInput {
		return {
			name: input.name,
			password: this.encryptPassword(input.password),
			enabled: false,
			admin: input.admin
		};
	}
	protected onCreationFailure(input: UserQueryParameters.CreateInput): MeeloException | Promise<MeeloException> {
		throw new UserAlreadyExistsException(input.name);
	}
	protected formatCreateInputToWhereInput(input: UserQueryParameters.CreateInput): UserQueryParameters.WhereInput {
		return {
			byName: {
				name: input.name
			}
		}
	}
	formatWhereInput(input: UserQueryParameters.WhereInput): Prisma.UserWhereInput {
		return {
			id: input.byId?.id,
			name: input.byName?.name ?? input.byCredentials?.name,
			password: input.byCredentials ? this.encryptPassword(input.byCredentials.password) : undefined
		}
	}

	async get(input: UserQueryParameters.WhereInput): Promise<User> {
		const user = await super.get(input.byId
			? { byId: input.byId }
			: { byName: input.byName ?? { name: input.byCredentials.name } }
		);
		if (input.byCredentials && !bcrypt.compareSync(input.byCredentials.password, user.password)) {
			throw await this.onNotFound(input);
		}
		return user;
	}

	onNotFound(where: UserQueryParameters.WhereInput): MeeloException | Promise<MeeloException> {
		if (where.byCredentials) {
			throw new UserNotFoundFromCredentialsException(where.byCredentials.name);
		}
		if (where.byId) {
			throw new UserNotFoundFromIDException(where.byId.id);
		}
		throw new UserNotFoundException(where.byName.name);
	}
	formatManyWhereInput(input: UserQueryParameters.ManyWhereInput): Prisma.UserWhereInput {
		return input;
	}
	formatSortingInput(_sortingParameter: SortingParameter<[]>): Prisma.UserOrderByWithRelationInput {
		return {};
	}
	formatUpdateInput(what: UserQueryParameters.UpdateInput): Prisma.UserUpdateInput {
		return {
			...what,
			password: what.password ? this.encryptPassword(what.password) : undefined
		}
	}
	formatDeleteInput(where: UserQueryParameters.DeleteInput): Prisma.UserWhereUniqueInput {
		return {
			id: where.id,
			name: where.name
		}
	}
	protected formatDeleteInputToWhereInput(input: UserQueryParameters.DeleteInput): UserQueryParameters.WhereInput {
		if (input.id) {
			return { byId: { id: input.id }};
		}
		return { byName: { name: input.name! } };
	}

	buildResponse(input: User): UserResponse {
		return {
			name: input.name,
			id: input.id,
			admin: input.admin,
			enabled: input.enabled
		};
	}

}
