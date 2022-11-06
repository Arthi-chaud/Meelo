
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UnauthorizedRequestException } from 'src/exceptions/meelo-exception';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	handleRequest(err: any, user: any, _info: any, _context: ExecutionContext, _status?: any): any {
		if (err || !user) {
			throw err || new UnauthorizedRequestException("Unauthorized, authentication required");
		}
		return user;
	}
}