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

import { translate } from "../../i18n/translate";
import { AlbumWithRelations } from "../../models/album";
import getYear from "../../utils/getYear";
import HighlightCard from "./highlight-card";

type AlbumHighlightCardProps = {
	album: AlbumWithRelations<"artist" | "externalIds" | "genres">;
};
const AlbumHighlightCard = ({ album }: AlbumHighlightCardProps) => {
	return (
		<HighlightCard
			title={album.name}
			headline={album.name}
			body={
				album.externalIds
					.map((id) => id.description)
					.filter((desc): desc is string => desc !== null)
					.sort((descA, descB) => descA.length - descB.length)
					.at(0) ||
				[
					album.artist?.name ?? translate("compilation"),
					getYear(album.releaseDate),
				]
					.filter((elem) => elem != null)
					.join(" - ")
			}
			tags={album.genres.map(({ name, slug }) => ({
				label: name,
				href: `/genres/${slug}`,
			}))}
			illustration={album.illustration}
			href={`/albums/${album.artist?.slug ?? "compilations"}+${
				album.slug
			}`}
		/>
	);
};

export default AlbumHighlightCard;