/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Injectable } from "@nestjs/common";
import bcrypt from "bcrypt";
import { PrismaError } from "prisma-error-enum";
import { InvalidRequestException } from "src/exceptions/meelo-exception";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";
import type Identifier from "src/identifier/models/identifier";
import type { PaginationParameters } from "src/pagination/models/pagination-parameters";
import { Prisma } from "src/prisma/generated/client";
import type { User } from "src/prisma/models";
import PrismaService from "src/prisma/prisma.service";
import {
	formatIdentifier,
	formatPaginationParameters,
} from "src/repository/repository.utils";
import type UserQueryParameters from "./models/user.query-params";
import {
	InvalidPasswordException,
	InvalidUserCredentialsException,
	InvalidUsernameException,
	UserAlreadyExistsException,
	UserNotFoundException,
	UserNotFoundFromIDException,
	UserNotFoundFromJwtPayload,
} from "./user.exceptions";

@Injectable()
export default class UserService {
	private readonly passwordHashSaltRound = 9;

	constructor(protected prismaService: PrismaService) {}

	private encryptPassword(plainTextPassword: string): string {
		return bcrypt.hashSync(plainTextPassword, this.passwordHashSaltRound);
	}

	/**
	 * Checks a username respect policy
	 * @returns true if username is valid
	 */
	usernameIsValid(usernameCandidate: string): boolean {
		return usernameCandidate.match("^[a-zA-Z0-9-_]{4,}$") !== null;
	}

	/**
	 * Checks a password respect policy
	 * @returns true if password is valid
	 */
	passwordIsValid(passwordCandidate: string): boolean {
		return passwordCandidate.match("^\\S{6,}$") !== null;
	}

	/**
	 * Throws is credentials candidate do not respect the policy
	 * @param credentials the username and password
	 */
	checkCredentialsAreValid(
		credentials: Partial<Pick<User, "name" | "password">>,
	) {
		if (credentials.name && !this.usernameIsValid(credentials.name)) {
			throw new InvalidUsernameException();
		}
		if (
			credentials.password &&
			!this.passwordIsValid(credentials.password)
		) {
			throw new InvalidPasswordException();
		}
	}

	async create(input: UserQueryParameters.CreateInput): Promise<User> {
		this.checkCredentialsAreValid(input);
		const isFirstUser = (await this.prismaService.user.count({})) === 0;

		return this.prismaService.user
			.create({
				data: {
					name: input.name,
					password: this.encryptPassword(input.password),
					enabled: isFirstUser || input.enabled,
					admin: isFirstUser,
				},
			})
			.catch((error) => {
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					error.code === PrismaError.UniqueConstraintViolation
				) {
					throw new UserAlreadyExistsException(input.name);
				}
				throw new UnhandledORMErrorException(error, input);
			});
	}

	private formatWhereInput(where: UserQueryParameters.WhereInput) {
		return {
			id: where.id ?? where.byJwtPayload?.id,
			name:
				where.name ??
				where.byCredentials?.name ??
				where.byJwtPayload?.name,
			password: where.byCredentials
				? this.encryptPassword(where.byCredentials.password)
				: undefined,
		};
	}

	async get(where: UserQueryParameters.WhereInput) {
		return this.prismaService.user
			.findFirstOrThrow({
				where: where.byCredentials
					? { name: where.byCredentials.name }
					: this.formatWhereInput(where),
			})
			.then((created) => {
				if (
					where.byCredentials &&
					!bcrypt.compareSync(
						where.byCredentials.password,
						created.password,
					)
				) {
					throw new InvalidUserCredentialsException(
						where.byCredentials.name,
					);
				}
				return created;
			})
			.catch((error) => {
				if (error instanceof InvalidUserCredentialsException) {
					throw error;
				}
				throw this.onNotFound(error, where);
			});
	}

	private onNotFound(error: any, where: UserQueryParameters.WhereInput) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === PrismaError.RecordsNotFound
		) {
			if (where.byCredentials) {
				return new InvalidUserCredentialsException(
					where.byCredentials.name,
				);
			}
			if (where.id !== undefined) {
				return new UserNotFoundFromIDException(where.id);
			}
			if (where.name !== undefined) {
				return new UserNotFoundException(where.name);
			}
			return new UserNotFoundFromJwtPayload(
				where.byJwtPayload.name,
				where.byJwtPayload.id,
			);
		}

		return new UnhandledORMErrorException(error, where);
	}

	async getMany(
		where: UserQueryParameters.ManyWhereInput,
		sort?: UserQueryParameters.SortingParameter,
		pagination?: PaginationParameters,
	) {
		return this.prismaService.user.findMany({
			where: where,
			orderBy:
				sort !== undefined ? this.formatSortingInput(sort) : undefined,
			...formatPaginationParameters(pagination),
		});
	}

	static formatIdentifierToWhereInput(
		identifier: Identifier,
	): UserQueryParameters.WhereInput {
		return formatIdentifier(identifier, (_) => {
			throw new InvalidRequestException(
				`Identifier: expected a number, got ${identifier}`,
			);
		});
	}

	formatSortingInput(sortingParameter: UserQueryParameters.SortingParameter) {
		return {
			[sortingParameter.sortBy ?? "id"]: sortingParameter.order ?? "asc",
		};
	}

	async update(
		what: UserQueryParameters.UpdateInput,
		where: UserQueryParameters.WhereInput,
	): Promise<User> {
		const formattedInput = this.formatUpdateInput(what);
		return this.prismaService.user
			.update({
				data: formattedInput,
				where: this.formatWhereInput(where),
			})
			.catch((error) => {
				throw this.onNotFound(error, where);
			});
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
			password: what.password
				? this.encryptPassword(what.password)
				: undefined,
		};
	}

	async delete(where: UserQueryParameters.DeleteInput) {
		return this.prismaService.user
			.delete({
				where: {
					id: where.id,
					name: where.name,
				},
			})
			.catch((error) => {
				throw this.onNotFound(error, where);
			});
	}

	async housekeeping(): Promise<void> {}
}
