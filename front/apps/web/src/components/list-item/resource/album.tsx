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
import AlbumContextualMenu from "~/components/contextual-menu/resource/album";
import Illustration from "~/components/illustration";
import ListItem from "~/components/list-item";

type AlbumItemProps = {
	album: AlbumWithRelations<"artist" | "illustration"> | undefined;
	formatSubtitle?: (album: AlbumWithRelations<"artist">) => string;
	onClick?: () => void;
};

/**
 * Item for a list of albums
 * @param props
 * @returns
 */
const AlbumItem = ({ album, formatSubtitle, onClick }: AlbumItemProps) => {
	const artist = album?.artist;
	const { t } = useTranslation();

	return (
		<ListItem
			icon={
				<Illustration
					illustration={album?.illustration}
					quality="low"
					fallback={<AlbumIcon />}
				/>
			}
			onClick={onClick}
			href={album ? `/albums/${album.slug}` : undefined}
			title={album?.name}
			secondTitle={
				album
					? (formatSubtitle?.call(this, album) ??
						artist?.name ??
						t("compilationArtistLabel"))
					: undefined
			}
			trailing={album && <AlbumContextualMenu album={album} />}
		/>
	);
};

export default AlbumItem;
