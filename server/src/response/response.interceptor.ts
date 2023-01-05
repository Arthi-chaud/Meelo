import {
	CallHandler, ExecutionContext, Injectable, NestInterceptor, Type
} from "@nestjs/common";
import {
	from, map, mergeMap
} from "rxjs";
import PaginatedResponse from "src/pagination/models/paginated-response";

abstract class ResponseBuilder<FromType, ToType extends Type<unknown>> {
	abstract buildResponse(fromInstance: FromType): Promise<ToType>;
}

/**
 * Interface for Interceptor that builds a response
 */
export default abstract class ResponseBuilderInterceptor<
	FromType,
	ToType extends Type<unknown> = Type<unknown>
> extends ResponseBuilder<FromType, ToType> implements NestInterceptor<FromType, ToType> {
	/**
	 * The Class of the Response instance
	 * Used for OpenAPI
	*/
	abstract returnType: ToType;

	intercept(_context: ExecutionContext, next: CallHandler<FromType>) {
		return next
			.handle()
			.pipe(
				mergeMap((value) => from(this.buildResponse(value)).pipe((data) => data)),
			);
	}
}

/**
 * Interceptor that catches a array of items, and turns it into a page of items
 */
@Injectable()
export class PaginatedResponseBuilderInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler<any>) {
		const request = context.switchToHttp().getRequest();

		return next
			.handle()
			.pipe(map(
				(items) => new PaginatedResponse(items, request)
			));
	}
}

/**
 * Interceptor that catches a array of items, and turns it into a array of response types
 */
@Injectable()
export class ArrayResponseBuilderInterceptor<FormData, ToType extends Type<unknown>> implements NestInterceptor {
	constructor(
		private responseBuilder: ResponseBuilderInterceptor<FormData, ToType>
	) {}

	intercept(_context: ExecutionContext, next: CallHandler<any>) {
		return next
			.handle()
			.pipe(mergeMap(
				(items: FormData[]) => from(Promise.all(
					items.map(
						(item: FormData) => this.responseBuilder.buildResponse(item)
					)
				)).pipe((data) => data)
			));
	}
}
