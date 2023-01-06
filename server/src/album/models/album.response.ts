import {
	Inject, Injectable, forwardRef
} from "@nestjs/common";
import { IntersectionType } from "@nestjs/swagger";
import { ArtistResponse } from "src/artist/models/artist.response";
import { IllustratedModel } from "src/illustration/models/illustrated-model.response";
import { Album } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/response.interceptor";
import AlbumService from "../album.service";

export class AlbumResponse extends IntersectionType(
	IntersectionType(
		Album, IllustratedModel
	),
	class {
		artist?: ArtistResponse | null;
	}
) {}

@Injectable()
export class AlbumResponseBuilder extends ResponseBuilderInterceptor<Album, AlbumResponse> {
	constructor(
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService
	) {
		super();
	}

	returnType = AlbumResponse;

	async buildResponse(_fromInstance: Album): Promise<AlbumResponse> {
		return this.albumService.buildResponse(_fromInstance);
	}
}
