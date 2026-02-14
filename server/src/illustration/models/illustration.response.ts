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
import { Illustration } from "src/prisma/models";

export class IllustrationResponse extends Illustration {
	@ApiProperty({
		description: "URL to the illustration",
		example: "/illustrations/123",
	})
	url: string;

	static from(illustration: Illustration): IllustrationResponse {
		return {
			id: illustration.id,
			aspectRatio: illustration.aspectRatio,
			colors: illustration.colors,
			blurhash: illustration.blurhash,
			type: illustration.type,
			url: `/illustrations/${illustration.id}`,
		};
	}
}

export class IllustratedResponse {
	@ApiProperty({
		nullable: true,
		type: IllustrationResponse,
		description: "Use 'with' query parameter to include this field",
	})
	illustration?: IllustrationResponse | null;
}
