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

import {
	type CallHandler,
	type ExecutionContext,
	Injectable,
	type NestInterceptor,
} from "@nestjs/common";
import { map } from "rxjs";
import PaginatedResponse from "src/pagination/models/paginated-response";

/**
 * Interceptor that catches a array of items, and turns it into a page of items
 */
@Injectable()
export default class PaginatedResponseBuilderInterceptor
	implements NestInterceptor
{
	constructor(private paginationIdKey: string) {}
	intercept(context: ExecutionContext, next: CallHandler<any>) {
		const request = context.switchToHttp().getRequest();

		return next
			.handle()
			.pipe(
				map(
					(items) =>
						new PaginatedResponse(
							items,
							request,
							this.paginationIdKey,
						),
				),
			);
	}
}
