import { IsNotEmpty } from 'class-validator';

export class LibraryDto {
	@IsNotEmpty()
	path: string;
	@IsNotEmpty()
	name: string;
}