import {
	CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor, Type
} from "@nestjs/common";
import {
	from, map, mergeMap
} from "rxjs";
import PaginatedResponse from "src/pagination/models/paginated-response";
import Constructor from "src/utils/constructor";

/**
 * Interface for Interceptor that builds a response
 */
export default abstract class ResponseBuilderInterceptor<
	FromType,
	ToClass extends InstanceType<any>,
	ToType extends ToClass extends InstanceType<infer T>
		? T : never = (ToClass extends InstanceType<infer T> ? T : never)
> implements NestInterceptor<FromType, ToType> {
	constructor() {}
	/**
	 * The Class of the Response instance
	 * Used for OpenAPI
	*/
	abstract returnType: ToType;

	abstract buildResponse(fromInstance: FromType): Promise<InstanceType<ToType>>;

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

export function ArrayResponseBuilderInterceptor<
	FormData, ToType extends InstanceType<Type<unknown>>,
	ResponseBuilder extends ResponseBuilderInterceptor<FormData, ToType>
>(
	responseBuilder: Constructor<ResponseBuilder>
) {
	@Injectable()
	class ArrayInterceptor implements NestInterceptor {
		constructor(
			/**
			 * Settings the property to public is a limitation of exported abstract classes
			 */
			@Inject(responseBuilder)
			public builder: ResponseBuilder
		) {}

		intercept(_context: ExecutionContext, next: CallHandler<any>) {
			return next
				.handle()
				.pipe(mergeMap(
					(items: FormData[]) => from(Promise.all(
						items.map(
							(item: FormData) => this.builder.buildResponse(item)
						)
					)).pipe((data) => data)
				));
		}
	}

	return ArrayInterceptor;
}
