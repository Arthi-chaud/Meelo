import { ApiProperty } from "@nestjs/swagger";
import { AlbumType } from "@prisma/client";
import {
	IsEnum, IsNumber, IsOptional
} from "class-validator";
import { Artist } from "src/prisma/models";

export default class UpdateAlbumDTO {
	@ApiProperty({
		description: 'The ID of the artist to reassign the album to',
		example: 123
	})
	@IsNumber()
	@IsOptional()
	artistId?: Artist['id'] | null;

	@ApiProperty({
		description: 'The type of the album',
		enum: AlbumType
	})
	@IsEnum(AlbumType)
	@IsOptional()
	type?: AlbumType;
}
