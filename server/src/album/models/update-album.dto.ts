/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { ApiProperty } from "@nestjs/swagger";
import { AlbumType } from "src/prisma/generated/client";
import { IsEnum, IsOptional } from "class-validator";

export default class UpdateAlbumDTO {
	@ApiProperty({
		description: "The type of the album",
		enum: AlbumType,
	})
	@IsEnum(AlbumType)
	@IsOptional()
	type?: AlbumType;

	@ApiProperty({
		description: "The Genres of the album",
		isArray: true,
	})
	@IsOptional()
	genres?: string[];

	@ApiProperty({
		description: "The original release date of the album",
	})
	@IsOptional()
	releaseDate?: Date;

	@ApiProperty({
		description: "ID of the release to set as master",
	})
	@IsOptional()
	masterReleaseId?: number;
}
