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

import type {
	CallHandler,
	ExecutionContext,
	NestInterceptor,
} from "@nestjs/common";
import { from, mergeMap } from "rxjs";

/**
 * Interface for Interceptor that builds a response
 */
export default abstract class ResponseBuilderInterceptor<
	FromType,
	ToClass extends InstanceType<any>,
	ToType extends ToClass extends InstanceType<infer T>
		? T
		: never = ToClass extends InstanceType<infer T> ? T : never,
> implements NestInterceptor<FromType, ToType>
{
	/**
	 * The Class of the Response instance
	 * Used for OpenAPI
	 */
	abstract returnType: ToType;

	abstract buildResponse(
		fromInstance: FromType,
	): Promise<InstanceType<ToType>>;

	intercept(_context: ExecutionContext, next: CallHandler<FromType>) {
		return next
			.handle()
			.pipe(
				mergeMap((value) =>
					from(this.buildResponse(value)).pipe((data) => data),
				),
			);
	}
}
