import {
	Inject, Injectable, forwardRef
} from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { LyricsWithRelations } from "src/prisma/models";
import ResponseBuilderInterceptor from "src/response/interceptors/response.interceptor";
import { SongResponse, SongResponseBuilder } from "src/song/models/song.response";

export class LyricsResponse {
	@ApiProperty({
		description: 'A new-line-separated string, representing the lyrics of a song'
	})
	lyrics: string;

	song?: SongResponse;
}

@Injectable()
export class LyricsResponseBuilder extends ResponseBuilderInterceptor<LyricsWithRelations, LyricsResponse> {
	constructor(
		@Inject(forwardRef(() => SongResponseBuilder))
		private songResponseBuilder: SongResponseBuilder
	) {
		super();
	}

	returnType = LyricsResponse;

	async buildResponse(input: LyricsWithRelations): Promise<LyricsResponse> {
		const response: LyricsResponse = { lyrics: input.content };

		if (input.song) {
			response.song = await this.songResponseBuilder.buildResponse(input.song);
		}
		return response;
	}
}
