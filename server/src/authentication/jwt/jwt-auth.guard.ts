
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { UnauthorizedAnonymousRequestException } from '../authentication.exception';
import { IS_PUBLIC_KEY } from '../roles/public.decorator';

@Injectable()
export default class JwtAuthGuard extends AuthGuard('jwt') {
	constructor(private reflector: Reflector) {
		super();
	}

	handleRequest(err: any, user: any, _info: any, _context: ExecutionContext, _status?: any): any {
		if (err || !user) {
			throw err || new UnauthorizedAnonymousRequestException();
		}
		return user;
	}

	canActivate(context: ExecutionContext) {
		const isPublic = this.reflector.getAllAndOverride<boolean>(
			IS_PUBLIC_KEY,
			[context.getHandler(), context.getClass()]
		);

		if (isPublic) {
			return true;
		}
		return super.canActivate(context);
	}
}
