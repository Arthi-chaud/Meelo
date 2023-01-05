import { Injectable } from "@nestjs/common";
import { IntersectionType } from "@nestjs/swagger";
import { ArtistResponse } from "src/artist/models/artist.response";
import { IllustratedModel } from "src/illustration/models/illustrated-model.response";
import { Album } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/response.interceptor";

export class AlbumResponse extends IntersectionType(
	IntersectionType(
		Album, IllustratedModel
	),
	class {
		artist?: ArtistResponse | null;
	}
) {}

@Injectable()
export class AlbumResponseBuilder extends ResponseBuilderInterceptor<Album, typeof AlbumResponse> {
	constructor() {
		super();
	}

	returnType = AlbumResponse;

	async buildResponse(_fromInstance: Album): Promise<typeof AlbumResponse> {
		return <typeof AlbumResponse><unknown>{
			..._fromInstance,
			illustration: ''
		};
	}
}
