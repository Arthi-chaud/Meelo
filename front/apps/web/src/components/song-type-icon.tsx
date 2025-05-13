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

import type { SongType } from "@meelo/models/song";
import type { IconProps } from "./icons";
import {
	SongIcon,
	SongTypeAcapellaIcon,
	SongTypeAcousticIcon,
	SongTypeCleanIcon,
	SongTypeDemoIcon,
	SongTypeEditIcon,
	SongTypeInstrumentalIcon,
	SongTypeLiveIcon,
	SongTypeMedleyIcon,
	SongTypeNonMusicIcon,
	SongTypeOriginalIcon,
	SongTypeRemixIcon,
} from "./icons";

const SongTypeIcon = ({ type, ...props }: { type: SongType } & IconProps) => {
	const Icon = () => {
		switch (type) {
			case "Original":
				return SongTypeOriginalIcon;
			case "Remix":
				return SongTypeRemixIcon;
			case "Live":
				return SongTypeLiveIcon;
			case "Acoustic":
				return SongTypeAcousticIcon;
			case "Instrumental":
				return SongTypeInstrumentalIcon;
			case "Edit":
				return SongTypeEditIcon;
			case "Clean":
				return SongTypeCleanIcon;
			case "Demo":
				return SongTypeDemoIcon;
			case "Acappella":
				return SongTypeAcapellaIcon;
			case "Medley":
				return SongTypeMedleyIcon;
			case "NonMusic":
				return SongTypeNonMusicIcon;
			default:
				return SongIcon;
		}
	};

	const IconComponent = Icon();
	return <IconComponent {...props} />;
};

export default SongTypeIcon;
