import { Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Response } from 'express';

@Catch()
export default class AllExceptionsFilter extends BaseExceptionFilter {
	catch(exception: Error, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		Logger.error(exception);
		response
			.status(HttpStatus.INTERNAL_SERVER_ERROR)
			.json({
				error: "An error occured, Try again.",
			});
	}
}