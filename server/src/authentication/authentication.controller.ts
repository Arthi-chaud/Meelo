import AuthenticationService from './authentication.service';
import {
	Controller, Post, Request, UseGuards
} from '@nestjs/common';
import * as Express from 'express';
import { LocalAuthGuard } from './local/local-auth.guard';
import {
	ApiBody, ApiOperation, ApiTags
} from '@nestjs/swagger';
import { User } from 'src/prisma/models';
import LoginDTO from './models/login.dto';
import { Public } from './roles/public.decorator';

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
	@Public()
	@UseGuards(LocalAuthGuard)
	@Post('login')
	async login(@Request() request: Express.Request) {
		return this.authenticationService.login(request.user as User);
	}
}
