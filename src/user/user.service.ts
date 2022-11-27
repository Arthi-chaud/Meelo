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
import {
	InvalidPasswordException, InvalidUserCredentialsException,
	InvalidUsernameException, UserAlreadyExistsException,
	UserNotFoundException, UserNotFoundFromIDException
} from './user.exceptions';

@Injectable()
export default class UserService extends RepositoryService<
	User,
	UserQueryParameters.CreateInput,
	UserQueryParameters.WhereInput,
	UserQueryParameters.ManyWhereInput,
	UserQueryParameters.UpdateInput,
	UserQueryParameters.DeleteInput,
	UserQueryParameters.SortingKeys,
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

	/**
	 * Checks a username respect policy
	 * @returns true if username is valid
	 */
	usernameIsValid(usernameCandidate: string): boolean {
		// eslint-disable-next-line no-useless-escape
		return usernameCandidate.match('^[a-zA-Z0-9\-\_]{4,}$') != null;
	}

	/**
	 * Checks a password respect policy
	 * @returns true if password is valid
	 */
	passwordIsValid(passwordCandidate: string): boolean {
		return passwordCandidate.match('^\\S{6,}$') != null;
	}

	/**
	 * Throws is credentials candidate do not respect the policy
	 * @param credentials the username and password
	 */
	checkCredentialsAreValid(credentials: Partial<Pick<User, 'name' | 'password'>>) {
		if (credentials.name && !this.usernameIsValid(credentials.name)) {
			throw new InvalidUsernameException();
		}
		if (credentials.password && !this.passwordIsValid(credentials.password)) {
			throw new InvalidPasswordException();
		}
	}

	formatCreateInput(input: UserQueryParameters.CreateInput) {
		return {
			name: input.name,
			password: this.encryptPassword(input.password),
			enabled: input.enabled ?? false,
			admin: input.admin
		};
	}

	async create(input: UserQueryParameters.CreateInput): Promise<User> {
		this.checkCredentialsAreValid(input);
		const isFirstUser = await this.count({}) == 0;

		return super.create({
			...input,
			admin: isFirstUser,
			enabled: isFirstUser || input.enabled
		});
	}

	protected onCreationFailure(
		input: UserQueryParameters.CreateInput
	): MeeloException | Promise<MeeloException> {
		throw new UserAlreadyExistsException(input.name);
	}

	protected formatCreateInputToWhereInput(
		input: UserQueryParameters.CreateInput
	): UserQueryParameters.WhereInput {
		return {
			byName: {
				name: input.name
			}
		};
	}

	formatWhereInput(input: UserQueryParameters.WhereInput): Prisma.UserWhereInput {
		return {
			id: input.byId?.id,
			name: input.byName?.name ?? input.byCredentials?.name,
			password: input.byCredentials
				? this.encryptPassword(input.byCredentials.password)
				: undefined
		};
	}

	async get(input: UserQueryParameters.WhereInput): Promise<User> {
		const user = await super.get(input.byId
			? { byId: input.byId }
			: { byName: input.byName ?? { name: input.byCredentials.name } });

		if (input.byCredentials &&
			!bcrypt.compareSync(input.byCredentials.password, user.password)) {
			throw await this.onNotFound(input);
		}
		return user;
	}

	onNotFound(where: UserQueryParameters.WhereInput): MeeloException | Promise<MeeloException> {
		if (where.byCredentials) {
			throw new InvalidUserCredentialsException(where.byCredentials.name);
		}
		if (where.byId) {
			throw new UserNotFoundFromIDException(where.byId.id);
		}
		throw new UserNotFoundException(where.byName.name);
	}

	formatManyWhereInput(input: UserQueryParameters.ManyWhereInput): Prisma.UserWhereInput {
		return input;
	}

	formatSortingInput(sortingParameter: SortingParameter<UserQueryParameters.SortingKeys>) {
		return { [sortingParameter.sortBy]: sortingParameter.order };
	}

	async update(
		what: UserQueryParameters.UpdateInput, where: UserQueryParameters.WhereInput
	): Promise<User> {
		const formattedInput = this.formatUpdateInput(what);

		return super.update(formattedInput, where);
	}

	formatUpdateInput(what: UserQueryParameters.UpdateInput) {
		if (what.name && !this.usernameIsValid(what.name)) {
			throw new InvalidUsernameException();
		}
		if (what.password && !this.passwordIsValid(what.password)) {
			throw new InvalidPasswordException();
		}
		return {
			...what,
			password: what.password ? this.encryptPassword(what.password) : undefined
		};
	}

	formatDeleteInput(where: UserQueryParameters.DeleteInput): Prisma.UserWhereUniqueInput {
		return {
			id: where.id,
			name: where.name
		};
	}

	protected formatDeleteInputToWhereInput(
		input: UserQueryParameters.DeleteInput
	): UserQueryParameters.WhereInput {
		if (input.id) {
			return { byId: { id: input.id } };
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
