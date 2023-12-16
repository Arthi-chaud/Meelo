import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { MeeloException } from "./meelo-exception";

@Catch(MeeloException)
export default class MeeloExceptionFilter implements ExceptionFilter {
	catch(exception: MeeloException, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const status = exception.getErrorStatus();

		response.status(status).json({
			statusCode: status,
			message: exception.message,
		});
	}
}
