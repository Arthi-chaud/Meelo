import { Prisma } from "@prisma/client";

/**
 * Exception which, if caught by the global filter will return a 500 HTTP response
 * Used when an unhandled error from the ORM occurs
 */
export class UnhandledORMErrorException extends Error {
	constructor(error: Error, ...inputs: any[]) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			super(`Unhandled ORM Error '${error.name}' (${error.code}): ${error.message}. Received Input: ${inputs.map((input) => JSON.stringify(input)).join(', ')}.\n${error.stack}`);
		} else {
			super(`Unhandled ORM Error: '${error.name}' - ${error.message}. Received Input: ${inputs.map((input) => JSON.stringify(input)).join(', ')}.\n${error.stack}`);
		}
	}
}
