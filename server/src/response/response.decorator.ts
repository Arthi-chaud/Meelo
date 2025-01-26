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

import { type Type, UseInterceptors } from "@nestjs/common";
import { ApiOkResponse } from "@nestjs/swagger";
import type { Constructor, RequireExactlyOne } from "type-fest";
import { ApiPaginatedResponse } from "../pagination/paginated-response.decorator";
import ArrayResponseBuilderInterceptor from "./interceptors/array-response.interceptor";
import PaginatedResponseBuilderInterceptor from "./interceptors/page-response.interceptor";
import ResponseBuilderInterceptor from "./interceptors/response.interceptor";
import ResponseType from "./response-type.enum";

type ResponseDecoratorParam<
	ToType extends Type<Record<PaginationKey, number>>,
	PaginationKey extends string = "id",
	FromType = unknown,
> = {
	/**
	 * Tells if the response is a single item, an array, or a page
	 * @default SINGLE
	 */
	type?: ResponseType;
	paginationIdKey?: PaginationKey;
} & RequireExactlyOne<{
	handler: Constructor<ResponseBuilderInterceptor<FromType, ToType>>;
	returns: ToType;
}>;

/**
 * Controller method decorator to:
 * - Apply response type for OpenAPI
 * - 'Build' the response (i.e. finding the illustration path)
 * - Format pagination, if the response is a page
 */
const Response = <
	ToType extends Type<Record<PaginationKey, number>>,
	PaginationKey extends string = "id",
>(
	params: ResponseDecoratorParam<ToType, PaginationKey>,
): MethodDecorator => {
	return (target: any, propertyKey: string, descriptor: any) => {
		const interceptors = [];
		const openApiDecorators = [];
		const returnType =
			params.returns ?? Reflect.construct(params.handler!, []).returnType;

		if (params.type === ResponseType.Page) {
			openApiDecorators.push(ApiPaginatedResponse(returnType));
			interceptors.push(
				new PaginatedResponseBuilderInterceptor(
					params.paginationIdKey ?? "id",
				),
			);
		} else {
			openApiDecorators.push(
				ApiOkResponse({
					type: returnType,
					isArray: params.type === ResponseType.Array,
				}),
			);
		}
		if (params.handler) {
			if (
				params.type === ResponseType.Array ||
				params.type === ResponseType.Page
			) {
				interceptors.push(
					ArrayResponseBuilderInterceptor(params.handler),
				);
			} else {
				openApiDecorators.push(
					ApiOkResponse({
						type: returnType,
					}),
				);
				interceptors.push(params.handler);
			}
		}
		UseInterceptors(...interceptors)(target, propertyKey, descriptor);
		for (const decorator of openApiDecorators) {
			decorator(target, propertyKey, descriptor);
		}
		return descriptor;
	};
};

export default Response;
export { ResponseType };
