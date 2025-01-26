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
import { IsEnum, IsOptional, IsPositive } from "class-validator";
import { ImageQuality } from "./illustration-quality";

/**
 * A DTO to request an illustration with special dimensions
 */
export class IllustrationDimensionsDto {
	@IsPositive({
		message: () =>
			"Illustration's width: Expected a strictly positive number",
	})
	@IsOptional()
	@ApiProperty({
		description:
			"If set, will resize so that the image's width matches. Aspect ratio is preserved.",
	})
	width?: number;

	@IsPositive({
		message: () =>
			"Illustration's height: Expected a strictly positive number",
	})
	@IsOptional()
	@ApiProperty({
		description:
			"If set, will resize so that the image's height matches. Aspect ratio is preserved.",
	})
	height?: number;

	@IsEnum(ImageQuality)
	@IsOptional()
	@ApiProperty({
		enum: ImageQuality,
		description: "Quality preset",
	})
	quality?: ImageQuality;
}
