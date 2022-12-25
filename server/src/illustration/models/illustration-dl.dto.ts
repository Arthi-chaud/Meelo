import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class IllustrationDownloadDto {
	@ApiProperty({
		description: 'The URL of the illustration to download'
	})
	@IsNotEmpty()
	url: string;
}
