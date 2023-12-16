import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from "@nestjs/common";
import { map } from "rxjs";
// eslint-disable-next-line no-restricted-imports
import PaginatedResponse from "src/pagination/models/paginated-response";

/**
 * Interceptor that catches a array of items, and turns it into a page of items
 */
@Injectable()
export default class PaginatedResponseBuilderInterceptor
	implements NestInterceptor
{
	intercept(context: ExecutionContext, next: CallHandler<any>) {
		const request = context.switchToHttp().getRequest();

		return next
			.handle()
			.pipe(map((items) => new PaginatedResponse(items, request)));
	}
}
