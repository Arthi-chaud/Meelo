/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Prisma } from "src/prisma/generated/client";

/**
 * Exception which, if caught by the global filter will return a 500 HTTP response
 * Used when an unhandled error from the ORM occurs
 */
export class UnhandledORMErrorException extends Error {
	constructor(error: Error, ...inputs: any[]) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			super(
				`Unhandled ORM Error '${error.name}' (${error.code}): ${
					error.message
				}. Received Input: ${inputs
					.map((input) => JSON.stringify(input))
					.join(", ")}.\n${error.stack}`,
			);
		} else {
			super(
				`Unhandled ORM Error: '${error.name}' - ${
					error.message
				}. Received Input: ${inputs
					.map((input) => JSON.stringify(input))
					.join(", ")}.\n${error.stack}`,
			);
		}
	}
}
