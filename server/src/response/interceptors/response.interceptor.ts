import { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
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
	constructor() {}
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
