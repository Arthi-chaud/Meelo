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

import de from "./de.json";
import en from "./en.json";
import fr from "./fr.json";
import id from "./id.json";
import it from "./it.json";
import ru from "./ru.json";
import pt_br from "./pt-BR.json";

export default Object.entries({ en, fr, de, ru, id, it, pt_br }).reduce(
	(rest, [key, value]) => ({ ...rest, [key]: { translation: value } }),
	{},
);

export const Languages = ["en", "fr", "de", "ru", "it", "id", "pt_br"] as const;
export type Language = (typeof Languages)[number];
