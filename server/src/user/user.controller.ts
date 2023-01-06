import {
	Body, Controller, Delete, Get, Post, Put, Req, Request
} from "@nestjs/common";
import { User } from "@prisma/client";
import UserService from "./user.service";
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import UserCreateDTO from "./models/create-user.dto";
import Admin from "src/roles/admin.decorator";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import { PaginationQuery } from "src/pagination/pagination-query.decorator";
import { UserResponseBuilder } from "./models/user.response";
import SortingQuery from "src/sort/sort-query.decorator";
import UserQueryParameters from "./models/user.query-params";
import UpdateUserDTO from "./models/update-user.dto";
import { Public } from "src/roles/public.decorator";
import { InvalidRequestException } from "src/exceptions/meelo-exception";
import IdentifierParam from "src/identifier/identifier.pipe";
import Response, { ResponseType } from "src/response/response.decorator";

@ApiTags("Users")
@Controller("users")
export default class UserController {
	constructor(
		private userService: UserService
	) {}

	@ApiOperation({
		summary: 'Get info about the currently authentified user'
	})
	@Get('me')
	@Response({ handler: UserResponseBuilder })
	async getAuthenticatedUserProfile(@Request() request: Express.Request) {
		// Required to return a proper build response
		// eslint-disable-next-line no-extra-parens
		return this.userService.get({ id: (request.user as User).id });
	}

	@ApiOperation({
		summary: 'Create a new user account'
	})
	@Public()
	@Response({ handler: UserResponseBuilder })
	@Post('new')
	async createUserAccount(
		@Body() userDTO: UserCreateDTO
	) {
		return this.userService.create(userDTO);
	}

	@ApiOperation({
		summary: 'Update a user'
	})
	@Admin()
	@Response({ handler: UserResponseBuilder })
	@Put(':idOrSlug')
	async updateUserAccounts(
		@IdentifierParam(UserService)
		where: UserQueryParameters.WhereInput,
		@Body() updateUserDto: UpdateUserDTO,
	) {
		return this.userService.update(updateUserDto, where);
	}

	@ApiOperation({
		summary: 'Delete a user'
	})
	@Admin()
	@Response({ handler: UserResponseBuilder })
	@Delete(':idOrSlug')
	async deleteUserAccounts(
		@IdentifierParam(UserService)
		where: UserQueryParameters.WhereInput,
		@Req() request: Express.Request
	) {
		const user = await this.userService.get(where);
		const authenticatedUser = request.user as User;

		if (authenticatedUser.id == user.id) {
			throw new InvalidRequestException('Users can not delete themselves');
		}
		return this.userService.delete(
			{ id: user.id }
		);
	}

	@ApiOperation({
		summary: 'Get all user accounts'
	})
	@Response({
		handler: UserResponseBuilder,
		type: ResponseType.Page
	})
	@Admin()
	@Get()
	async getUserAccounts(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@SortingQuery(UserQueryParameters.SortingKeys)
		sortingParameter: UserQueryParameters.SortingParameter
	) {
		return this.userService.getMany(
			{}, paginationParameters, {}, sortingParameter
		);
	}

	@ApiOperation({
		summary: 'Get disabled user accounts'
	})
	@Response({
		handler: UserResponseBuilder,
		type: ResponseType.Page
	})
	@Admin()
	@Get('disabled')
	async getDisabledUserAccounts(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@SortingQuery(UserQueryParameters.SortingKeys)
		sortingParameter: UserQueryParameters.SortingParameter
	) {
		return this.userService.getMany(
			{ enabled: false },
			paginationParameters,
			{},
			sortingParameter
		);
	}

	@ApiOperation({
		summary: 'Get enabled admin user accounts'
	})
	@Response({
		handler: UserResponseBuilder,
		type: ResponseType.Page
	})
	@Admin()
	@Get('admins')
	async getAdminUserAccounts(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@SortingQuery(UserQueryParameters.SortingKeys)
		sortingParameter: UserQueryParameters.SortingParameter
	) {
		return this.userService.getMany(
			{ admin: true, enabled: true },
			paginationParameters,
			{},
			sortingParameter
		);
	}
}
