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

import Illustration from "../illustration";
import ListItem from "./item";
import AlbumContextualMenu from "../contextual-menu/album-contextual-menu";
import { AlbumWithRelations } from "../../models/album";
import { useMemo } from "react";
import { translate, useLanguage } from "../../i18n/translate";

type AlbumItemProps = {
	album: AlbumWithRelations<"artist">;
	formatSubtitle?: (album: AlbumWithRelations<"artist">) => string;
};

/**
 * Item for a list of albums
 * @param props
 * @returns
 */
const AlbumItem = ({ album, formatSubtitle }: AlbumItemProps) => {
	const artist = album.artist;
	const language = useLanguage();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const compilationKeyword = useMemo(
		() => translate("compilation"),
		[language],
	);

	return (
		<ListItem
			icon={
				<Illustration illustration={album.illustration} quality="low" />
			}
			href={`/albums/${artist?.slug ?? "compilations"}+${album.slug}`}
			title={album.name}
			secondTitle={
				formatSubtitle?.call(this, album) ??
				artist?.name ??
				compilationKeyword
			}
			trailing={<AlbumContextualMenu album={album} />}
		/>
	);
};

export default AlbumItem;
