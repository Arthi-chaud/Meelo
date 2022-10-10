import { IntersectionType } from "@nestjs/swagger";
import { Genre } from "src/prisma/models";
import { SongResponse } from "src/song/models/song.response";

export class GenreResponse extends IntersectionType(
	Genre,
	class {
		songs?: SongResponse[];
	}
) {}