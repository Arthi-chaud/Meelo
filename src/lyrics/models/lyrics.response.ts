import { ApiProperty } from "@nestjs/swagger";
import { SongResponse } from "src/song/models/song.response";

export class LyricsResponse {
	@ApiProperty({
		description: 'A new-line-separated string, representing the lyrics of a song'
	})
	lyrics: string;
	song?: SongResponse;
}