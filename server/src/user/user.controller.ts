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

import {
	Body,
	Controller,
	Delete,
	Get,
	Post,
	Put,
	Query,
	Req,
	Request,
} from "@nestjs/common";
import type { User } from "@prisma/client";
import UserService from "./user.service";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import type UserCreateDTO from "./models/create-user.dto";
import { Admin, Public, Role } from "src/authentication/roles/roles.decorators";
import type { PaginationParameters } from "src/pagination/models/pagination-parameters";
import { UserResponseBuilder } from "./models/user.response";
import type UserQueryParameters from "./models/user.query-params";
import type UpdateUserDTO from "./models/update-user.dto";
import { InvalidRequestException } from "src/exceptions/meelo-exception";
import IdentifierParam from "src/identifier/identifier.pipe";
import Response, { ResponseType } from "src/response/response.decorator";
import Roles from "src/authentication/roles/roles.enum";

@ApiTags("Users")
@Controller("users")
export default class UserController {
	constructor(private userService: UserService) {}

	@ApiOperation({
		summary: "Get info about the currently authentified user",
	})
	@Get("me")
	@Role(Roles.User)
	@Response({ handler: UserResponseBuilder })
	async getAuthenticatedUserProfile(@Request() request: Express.Request) {
		// Required to return a proper build response
		return this.userService.get({ id: (request.user as User).id });
	}

	@ApiOperation({
		summary: "Create a new user account",
	})
	@Public()
	@Response({ handler: UserResponseBuilder })
	@Post()
	async createUserAccount(@Body() userDTO: UserCreateDTO) {
		return this.userService.create(userDTO);
	}

	@ApiOperation({
		summary: "Update a user",
	})
	@Admin()
	@Response({ handler: UserResponseBuilder })
	@Put(":idOrSlug")
	async updateUserAccounts(
		@IdentifierParam(UserService)
		where: UserQueryParameters.WhereInput,
		@Body() updateUserDto: UpdateUserDTO,
	) {
		return this.userService.update(updateUserDto, where);
	}

	@ApiOperation({
		summary: "Delete a user",
	})
	@Admin()
	@Response({ handler: UserResponseBuilder })
	@Delete(":idOrSlug")
	async deleteUserAccounts(
		@IdentifierParam(UserService)
		where: UserQueryParameters.WhereInput,
		@Req() request: Express.Request,
	) {
		const user = await this.userService.get(where);
		const authenticatedUser = request.user as User;

		if (authenticatedUser.id === user.id) {
			throw new InvalidRequestException(
				"Users can not delete themselves",
			);
		}
		return this.userService.delete({ id: user.id });
	}

	@ApiOperation({
		summary: "Get all user accounts",
	})
	@Response({
		handler: UserResponseBuilder,
		type: ResponseType.Page,
	})
	@Admin()
	@Get()
	async getUserAccounts(
		@Query()
		paginationParameters: PaginationParameters,
		@Query()
		sortingParameter: UserQueryParameters.SortingParameter,
	) {
		return this.userService.getMany(
			{},
			sortingParameter,
			paginationParameters,
		);
	}

	@ApiOperation({
		summary: "Get disabled user accounts",
	})
	@Response({
		handler: UserResponseBuilder,
		type: ResponseType.Page,
	})
	@Admin()
	@Get("disabled")
	async getDisabledUserAccounts(
		@Query()
		paginationParameters: PaginationParameters,
		@Query()
		sortingParameter: UserQueryParameters.SortingParameter,
	) {
		return this.userService.getMany(
			{ enabled: false },
			sortingParameter,
			paginationParameters,
		);
	}

	@ApiOperation({
		summary: "Get enabled admin user accounts",
	})
	@Response({
		handler: UserResponseBuilder,
		type: ResponseType.Page,
	})
	@Admin()
	@Get("admins")
	async getAdminUserAccounts(
		@Query()
		paginationParameters: PaginationParameters,
		@Query()
		sortingParameter: UserQueryParameters.SortingParameter,
	) {
		return this.userService.getMany(
			{ admin: true, enabled: true },
			sortingParameter,
			paginationParameters,
		);
	}
}
