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

import Tile from "./tile";
import { AlbumWithRelations } from "../../models/album";
import Illustration from "../illustration";
import { useMemo } from "react";
import { translate, useLanguage } from "../../i18n/translate";
import AlbumContextualMenu from "../contextual-menu/album-contextual-menu";

const AlbumTile = (props: {
	album: AlbumWithRelations<"artist">;
	formatSubtitle?: (album: AlbumWithRelations<"artist">) => string;
}) => {
	const language = useLanguage();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const compilationKeyword = useMemo(
		() => translate("compilation"),
		[language],
	);

	return (
		<Tile
			contextualMenu={<AlbumContextualMenu album={props.album} />}
			title={props.album.name}
			subtitle={
				props.formatSubtitle?.call(this, props.album) ??
				props.album.artist?.name ??
				compilationKeyword
			}
			href={`/albums/${props.album.artist?.slug ?? "compilations"}+${
				props.album.slug
			}`}
			secondaryHref={
				!props.formatSubtitle
					? props.album.artist?.slug
						? `/artists/${props.album.artist.slug}`
						: undefined
					: undefined
			}
			illustration={
				<Illustration
					illustration={props.album.illustration}
					quality="med"
				/>
			}
		/>
	);
};

export default AlbumTile;
