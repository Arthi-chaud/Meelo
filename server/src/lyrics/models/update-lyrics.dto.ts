import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export default class LyricsDto {
	@ApiProperty({
		description: 'The new lyrics'
	})
	@IsString()
	@IsNotEmpty()
	lyrics: string;
}
