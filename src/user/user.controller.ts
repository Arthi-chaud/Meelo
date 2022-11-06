import { Controller, UseGuards, Get, Post, Request, Body } from "@nestjs/common";
import { User } from "@prisma/client";
import { JwtAuthGuard } from "src/authentication/jwt/jwt-auth.guard";
import UserService from "./user.service";
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import UserCreateDTO from "./models/user.dto";

@ApiTags("Users")
@Controller("users")
export default class UserController {
	constructor(
		private userService: UserService
	) {}
	
	@ApiOperation({
		summary: 'Get info about the currently authentified user'
	})
	@UseGuards(JwtAuthGuard)
	@Get('me')
	async getAuthenticatedUserProfile(@Request() request: Express.Request) {
		// Required to return a proper build response
		const user = await this.userService.get({ byId: { id: (request.user as User).id }});
		return this.userService.buildResponse(user);
	}

	@ApiOperation({
		summary: 'Create a new user account'
	})
	@Post('create')
	async createUserAccount(
		@Body() userDTO: UserCreateDTO
	) {
		return this.userService.buildResponse(await this.userService.create(userDTO));
	}
}