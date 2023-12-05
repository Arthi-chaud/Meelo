import {
	CallHandler, ExecutionContext, Global, Inject, Injectable, NestInterceptor, Type
} from "@nestjs/common";
import { from, mergeMap } from "rxjs";
import { Constructor } from 'type-fest';
import ResponseBuilderInterceptor from "./response.interceptor";

export default function ArrayResponseBuilderInterceptor<
	FormData, ToType extends InstanceType<Type<unknown>>,
	ResponseBuilder extends ResponseBuilderInterceptor<FormData, ToType>
>(
	responseBuilder: Constructor<ResponseBuilder>
) {
	@Global()
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
