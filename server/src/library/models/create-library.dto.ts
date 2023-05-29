import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export default class CreateLibraryDto {
	@ApiProperty({
		description: 'The local path to the library to create'
	})
	@IsString()
	@IsNotEmpty()
	path: string;

	@ApiProperty({
		description: 'The name of the library to create'
	})
	@IsString()
	@IsNotEmpty()
	name: string;
}
