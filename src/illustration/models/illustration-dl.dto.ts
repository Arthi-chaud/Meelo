import { IsNotEmpty } from 'class-validator';

export class IllustrationDownloadDto {
	@IsNotEmpty()
	url: string;
}