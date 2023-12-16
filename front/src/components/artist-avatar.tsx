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

import { Avatar } from "@mui/material";
import Artist from "../models/artist";
import Illustration from "./illustration";

const ArtistAvatar = (props: {
	artist: Artist;
	quality: Parameters<typeof Illustration>[0]["quality"];
}) => {
	return (
		<Avatar
			alt={props.artist.slug}
			sx={{
				width: "100%",
				height: "100%",
				background: "none",
				objectFit: "cover",
			}}
		>
			<Illustration
				imgProps={{ objectFit: "cover" }}
				illustration={props.artist.illustration}
				quality={props.quality}
			/>
		</Avatar>
	);
};

export default ArtistAvatar;
