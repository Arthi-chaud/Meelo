
import { Type, UseInterceptors } from "@nestjs/common";
import { ApiPaginatedResponse } from "../pagination/paginated-response.decorator";
import { ApiOkResponse } from "@nestjs/swagger";
import ResponseBuilderInterceptor, { ArrayResponseBuilderInterceptor, PaginatedResponseBuilderInterceptor } from "./response.interceptor";
import RequireOnlyOne from "src/utils/require-only-one";

type ResponseDecoratorParam<ToType extends Type<unknown>, FromType = unknown> = {
	handler: ResponseBuilderInterceptor<FromType, ToType>
} & Partial<RequireOnlyOne<{
	page: true,
	array: true
}>>

/**
 * Controller method decorator to:
 * - Apply response type for OpenAPI
 * - 'Build' the response (i.e. finding the illustration path)
 * - Format pagination, if the response is a page
 */
const Response = <ToType extends Type<unknown>>(
	params: ResponseDecoratorParam<ToType>
): MethodDecorator => {
	return function (target: any, propertyKey: string, descriptor: any) {
		const interceptors = [];
		const openApiDecorators = [];

		if (params.page) {
			openApiDecorators.push(ApiPaginatedResponse(params.handler.returnType));
			interceptors.push(PaginatedResponseBuilderInterceptor);
		} else if (params.array) {
			openApiDecorators.push(ApiOkResponse({
				type: params.handler.returnType,
				isArray: true
			}));
		}
		if (params.page || params.array) {
			interceptors.push(new ArrayResponseBuilderInterceptor(params.handler));
		} else {
			openApiDecorators.push(ApiOkResponse({
				type: params.handler.returnType
			}));
			interceptors.push(params.handler);
		}
		UseInterceptors(...interceptors)(target, propertyKey, descriptor);
		openApiDecorators.forEach((decorator) => decorator(target, propertyKey, descriptor));
		return descriptor;
	};
};

export default Response;
