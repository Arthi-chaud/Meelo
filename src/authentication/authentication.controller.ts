import AuthenticationService from './authentication.service';
import { Controller, Request, UseGuards, Post } from '@nestjs/common';
import * as Express from 'express';
import { LocalAuthGuard } from './local/local-auth.guard';
import { ApiOperation, ApiTags, ApiBody } from '@nestjs/swagger';
import { User } from 'src/prisma/models';
import LoginDTO from './models/login.dto';

@ApiTags('Authentication')
@Controller('auth')
export default class AuthenticationController {

	constructor(
		private authenticationService: AuthenticationService,
	) {}

	@ApiOperation({
		summary: 'Login user',
	})
	@ApiBody({
		type: LoginDTO
	})
	@UseGuards(LocalAuthGuard)
	@Post('login')
	async login(@Request() request: Express.Request) {
		console.log(request.user);
		return this.authenticationService.login(request.user as User);
	}
}