import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';
import { MeeloException } from './meelo-exception';

@Catch(MeeloException)
export class MeeloExceptionFilter implements ExceptionFilter {
	catch(exception: MeeloException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const status = exception.getErrorStatus();

		response
			.status(status)
			.json({
				error: exception.message
			});
	}
}