import { Prisma } from "@prisma/client";
import { RequireOnlyOne } from "./require-only-one";

export type SearchDateInput = RequireOnlyOne<{ before: Date, onDay: Date, inYear: Date, after: Date }>;

export function buildDateSearchParameters(where: SearchDateInput) {
	if (where.onDay !== undefined)
		return {
			gte: new Date (where.onDay.setHours(0, 0, 0, 0)),
			lt: new Date (where.onDay.setHours(0, 0, 0, 0) + 3600 * 24)
		};
	else if (where.inYear !== undefined)
		return {
			gte: new Date (where.inYear.setMonth(0)),
			lt: new Date (where.inYear.setMonth(13))
		};
	return {
		lt: where.before,
		gt: where.after,
	};
}