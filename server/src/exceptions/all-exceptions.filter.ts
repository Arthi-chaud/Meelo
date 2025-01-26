/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { type ArgumentsHost, Catch, HttpStatus } from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";
import type { Response } from "express";
import Logger from "src/logger/logger";

@Catch()
export default class AllExceptionsFilter extends BaseExceptionFilter {
	catch(exception: any, host: ArgumentsHost) {
		const logger = new Logger();
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();

		if (exception.code === "ENOENT") {
			response.status(HttpStatus.NOT_FOUND).json({
				statusCode: HttpStatus.NOT_FOUND,
				message: "Not found.",
			});
		} else {
			if (process.env.NODE_ENV === "test") {
				// biome-ignore lint/suspicious/noConsole: Handy for debugging
				console.log(exception);
			}
			logger.error(exception);
			response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
				statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
				message: "An error occured",
			});
		}
	}
}
