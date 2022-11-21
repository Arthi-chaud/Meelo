import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export default class LyricsDto {
	@ApiProperty({
		description: 'The new lyrics'
	})
	@IsNotEmpty()
	lyrics: string;
}
