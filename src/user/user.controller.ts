import { Controller, Get, Post, Request, Body, Param, Put, Req, ParseIntPipe } from "@nestjs/common";
import { User } from "@prisma/client";
import UserService from "./user.service";
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import UserCreateDTO from "./models/create-user.dto";
import Admin from "src/roles/admin.decorator";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import { PaginationQuery } from "src/pagination/pagination-query.decorator";
import UserResponse from "./models/user.response";
import { ApiPaginatedResponse } from "src/pagination/paginated-response.decorator";
import SortingQuery from "src/sort/sort-query.decorator";
import UserQueryParameters from "./models/user.query-params";
import UpdateUserDTO from "./models/update-user.dto";
import PaginatedResponse from "src/pagination/models/paginated-response";

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
	async getAuthenticatedUserProfile(@Request() request: Express.Request) {
		// Required to return a proper build response
		const user = await this.userService.get({ byId: { id: (request.user as User).id }});
		return this.userService.buildResponse(user);
	}

	@ApiOperation({
		summary: 'Create a new user account'
	})
	@Post('new')
	async createUserAccount(
		@Body() userDTO: UserCreateDTO
	) {
		return this.userService.buildResponse(await this.userService.create(userDTO));
	}


	@ApiOperation({
		summary: 'Update a user'
	})
	@Admin()
	@Put(':id')
	async updateUserAccounts(
		@Param('id', ParseIntPipe) userId: number,
		@Body() updateUserDto: UpdateUserDTO,
	) {
		return this.userService.buildResponse(
			await this.userService.update(updateUserDto, { byId: { id: userId } })
		);
	}

	@ApiOperation({
		summary: 'Get all user accounts'
	})
	@ApiPaginatedResponse(UserResponse)
	@Admin()
	@Get()
	async getUserAccounts(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@SortingQuery(UserQueryParameters.SortingKeys)
		sortingParameter: UserQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		return new PaginatedResponse(
			(await this.userService.getMany(
				{ },
				paginationParameters, {},
				sortingParameter
			)).map((user) => this.userService.buildResponse(user)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get disabled user accounts'
	})
	@ApiPaginatedResponse(UserResponse)
	@Admin()
	@Get('disabled')
	async getDisabledUserAccounts(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@SortingQuery(UserQueryParameters.SortingKeys)
		sortingParameter: UserQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		return new PaginatedResponse(
			(await this.userService.getMany(
				{ enabled: false },
				paginationParameters, {},
				sortingParameter
			)).map((user) => this.userService.buildResponse(user)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get enabled admin user accounts'
	})
	@ApiPaginatedResponse(UserResponse)
	@Admin()
	@Get('admins')
	async getAdminUserAccounts(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@SortingQuery(UserQueryParameters.SortingKeys)
		sortingParameter: UserQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		return new PaginatedResponse(
			(await this.userService.getMany(
				{ admin: true, enabled: true },
				paginationParameters, {},
				sortingParameter
			)).map((user) => this.userService.buildResponse(user)),
			request
		);
	}
}