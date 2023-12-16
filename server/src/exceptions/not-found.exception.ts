import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpStatus,
	NotFoundException,
} from "@nestjs/common";

@Catch(NotFoundException)
export default class NotFoundExceptionFilter implements ExceptionFilter {
	catch(_exception: NotFoundException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse();

		response.status(HttpStatus.NOT_FOUND).json({
			statusCode: HttpStatus.NOT_FOUND,
			message: "Route not found.",
		});
	}
}
