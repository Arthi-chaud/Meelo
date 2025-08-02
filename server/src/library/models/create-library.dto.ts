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

import * as path from "node:path";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
	IsNotEmpty,
	IsString,
	Validate,
	ValidationArguments,
	ValidatorConstraint,
	ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint({ name: "customText", async: false })
export class IsRelative implements ValidatorConstraintInterface {
	validate(text: string, _args: ValidationArguments) {
		return !path.isAbsolute(text);
	}
	defaultMessage(_args: ValidationArguments) {
		return "Path should be relative";
	}
}

export default class CreateLibraryDto {
	@ApiProperty({
		description: "The local path to the library to create",
	})
	@Validate(IsRelative)
	@Transform(({ value }) => {
		const s = (value as string).replace("//", "/");

		if (s.startsWith("./") && s !== "./") {
			return s.slice(2);
		}
		return s;
	})
	@IsString()
	@IsNotEmpty()
	path: string;

	@ApiProperty({
		description: "The name of the library to create",
	})
	@IsString()
	@IsNotEmpty()
	name: string;
}
