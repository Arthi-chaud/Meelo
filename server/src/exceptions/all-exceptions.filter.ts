import {
	ArgumentsHost, Catch, HttpStatus, Logger
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Response } from 'express';

@Catch()
export default class AllExceptionsFilter extends BaseExceptionFilter {
	catch(exception: any, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		if (exception.code === 'ENOENT') {
			response
				.status(HttpStatus.NOT_FOUND)
				.json({
					statusCode: HttpStatus.NOT_FOUND,
					message: "Not found."
				});
		} else {
			Logger.error(exception);
			response
				.status(HttpStatus.INTERNAL_SERVER_ERROR)
				.json({
					statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
					message: "An error occured, Try again.",
				});
		}
	}
}
