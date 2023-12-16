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

import * as yup from "yup";

const MapValidator =
	<KeyType extends string | number, ValueType>(
		keyValidator: yup.Schema<KeyType>,
		valueValidator: yup.Schema<ValueType>,
	) =>
	async (value: unknown): Promise<Record<KeyType, ValueType>> => {
		const unsafeObject = value as Record<KeyType, ValueType>;
		const validatedObject = {} as Record<KeyType, ValueType>;

		for (const discIndex in unsafeObject) {
			const [validatedKey, validatedValue] = await Promise.all([
				keyValidator
					.validate(discIndex)
					.then((validated) => keyValidator.cast(validated)),
				valueValidator
					.validate(unsafeObject[discIndex])
					.then((validated) => valueValidator.cast(validated)),
			]);

			validatedObject[validatedKey] = validatedValue;
		}
		return validatedObject;
	};

export default MapValidator;
