import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class IllustrationDownloadDto {
	@ApiProperty({
		description: 'The URL of the illustration to download'
	})
	@IsString()
	@IsNotEmpty()
	url: string;
}
