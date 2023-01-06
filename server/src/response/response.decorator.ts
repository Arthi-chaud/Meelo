
import { Type, UseInterceptors } from "@nestjs/common";
import { ApiPaginatedResponse } from "../pagination/paginated-response.decorator";
import { ApiOkResponse } from "@nestjs/swagger";
import ResponseType from "./response-type.enum";
import Constructor from "src/utils/constructor";
import ArrayResponseBuilderInterceptor from "./interceptors/array-response.interceptor";
import PaginatedResponseBuilderInterceptor from "./interceptors/page-response.interceptor";
import ResponseBuilderInterceptor from "./interceptors/response.interceptor";
import type { RequireExactlyOne } from "type-fest";

type ResponseDecoratorParam<ToType extends Type<unknown>, FromType = unknown> = {
	/**
	 * Tells if the response is a single item, an array, or a page
	 * @default SINGLE
	 */
	type?: ResponseType;
} & RequireExactlyOne<{
	handler: Constructor<ResponseBuilderInterceptor<FromType, ToType>>;
	returns: ToType;
}>

// const createBasicResponseBuilder = <T extends Type<any>>(type: T) => {
// 	@Global()
// 	@Injectable()
// 	class BaseResponseBuilder extends ResponseBuilderInterceptor<T, Type<T>> {
// 		returnType = type;

// 		buildResponse = async (input: T) => input;
// 	}

// 	return BaseResponseBuilder;
// };

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
		const returnType = params.returns ?? Reflect.construct(params.handler!, []).returnType;

		if (params.type == ResponseType.Page) {
			openApiDecorators.push(ApiPaginatedResponse(returnType));
			interceptors.push(PaginatedResponseBuilderInterceptor);
		} else {
			openApiDecorators.push(ApiOkResponse({
				type: returnType,
				isArray: params.type == ResponseType.Array
			}));
		}
		if (params.handler) {
			if (params.type == ResponseType.Array || params.type == ResponseType.Page) {
				interceptors.push(ArrayResponseBuilderInterceptor(params.handler));
			} else {
				openApiDecorators.push(ApiOkResponse({
					type: returnType
				}));
				interceptors.push(params.handler);
			}
		}
		UseInterceptors(...interceptors)(target, propertyKey, descriptor);
		openApiDecorators.forEach((decorator) => decorator(target, propertyKey, descriptor));
		return descriptor;
	};
};

export default Response;
export { ResponseType };
