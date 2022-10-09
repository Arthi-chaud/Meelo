import { IntersectionType } from "@nestjs/swagger";
import { Genre } from "src/prisma/models";

export class GenreResponse extends IntersectionType(
	Genre,
	class {
		songs?: unknown;
	}
) {}