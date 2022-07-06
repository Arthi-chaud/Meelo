import { Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Response } from 'express';

@Catch()
export default class AllExceptionsFilter extends BaseExceptionFilter {
	catch(_exception: Error, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		response
			.status(HttpStatus.INTERNAL_SERVER_ERROR)
			.json({
				error: "An error occured, Try again.",
			});
	}
}