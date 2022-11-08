import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/prisma/models';
import UserService from 'src/user/user.service';
import { DisabledUserAccountException } from './authentication.exception';
import JwtPayload from './models/jwt.payload';
import JwtResponse from './models/jwt.response';

@Injectable()
export default class AuthenticationService {
	constructor(
		private userService: UserService,
		private jwtService: JwtService
	) { }

	async validateUser(username: string, plainTextPassword: string): Promise<User> {
		const requestedUser = await this.userService.get({ byCredentials: {
			name: username,
			password: plainTextPassword
		}});
		if (!requestedUser.enabled) {
			throw new DisabledUserAccountException();
		}
		return requestedUser;
	}

	async login(user: User): Promise<JwtResponse> {
		const payload: JwtPayload = { name: user.name, id: user.id };
		return {
			access_token: this.jwtService.sign(payload)
		}
	}
}
