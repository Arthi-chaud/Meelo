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

import { Injectable, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

/**
 * JWT Middleware to pass the access_token cookie or token query param to the Authorisation header
 * Must be done, as clients way not be able to pass headers to media requests (like image or audio HTML tags)
 */
@Injectable()
export class JwtCookieMiddleware implements NestMiddleware {
	use(req: Request, _res: Response, next: NextFunction) {
		const tokenQueryParam = req.cookies.access_token ?? req.query.token;
		if (tokenQueryParam) {
			req.headers.authorization ??= `Bearer ${tokenQueryParam}`;
		}
		next();
	}
}

export default JwtCookieMiddleware;
