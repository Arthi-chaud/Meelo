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

import { useTranslation } from "react-i18next";
import type { AlbumWithRelations } from "@/models/album";
import { AlbumIcon } from "@/ui/icons";
import { formatArtists_ } from "@/utils/format-artists";
import AlbumContextualMenu from "~/components/contextual-menu/resource/album";
import Illustration from "~/components/illustration";
import Tile from "~/components/tile";

const AlbumTile = (props: {
	album: AlbumWithRelations<"artists" | "illustration"> | undefined;
	formatSubtitle?: (album: AlbumWithRelations<"artists">) => string;
	onClick?: () => void;
}) => {
	const { t } = useTranslation();

	return (
		<Tile
			contextualMenu={
				props.album && <AlbumContextualMenu album={props.album} />
			}
			title={props.album?.name}
			subtitle={
				props.album === undefined
					? undefined
					: (props.formatSubtitle?.call(this, props.album) ??
						(props.album.artists.length
							? formatArtists_(props.album.artists)
							: t("compilationArtistLabel")))
			}
			onClick={props.onClick}
			href={props.album ? `/albums/${props.album.slug}` : undefined}
			secondaryHref={
				props.album
					? !props.formatSubtitle
						? props.album.artists.length
							? `/artists/${props.album.artists[0].slug}`
							: undefined
						: undefined
					: undefined
			}
			illustration={
				<Illustration
					illustration={props.album?.illustration}
					quality="medium"
					alignBottom
					fallback={<AlbumIcon />}
				/>
			}
		/>
	);
};

export default AlbumTile;
