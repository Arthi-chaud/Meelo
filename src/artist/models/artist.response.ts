import { IntersectionType } from "@nestjs/swagger";
import { IllustratedModel } from "src/illustration/models/illustrated-model.response";
import { Artist } from "src/prisma/models";

export class ArtistResponse extends IntersectionType(
	IntersectionType(
		Artist, IllustratedModel
	),
	class {
		albums?: unknown;
		songs?: unknown
	}
) {}