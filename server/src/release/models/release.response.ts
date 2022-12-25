import { IntersectionType } from "@nestjs/swagger";
import { AlbumResponse } from "src/album/models/album.response";
import { IllustratedModel } from "src/illustration/models/illustrated-model.response";
import { Release } from "src/prisma/models";

export class ReleaseResponse extends IntersectionType(
	IntersectionType(
		Release, IllustratedModel
	),
	class {
		album?: AlbumResponse;
	}
) {}
