import { ApiProperty } from "@nestjs/swagger";

export class LyricsResponse {
	@ApiProperty({
		description: 'A new-line-separated string, representing the lyrics of a song'
	})
	lyrics: string;
	song?: unknown
}