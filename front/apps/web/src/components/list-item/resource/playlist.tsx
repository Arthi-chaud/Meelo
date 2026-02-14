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

import type { PlaylistWithRelations } from "@/models/playlist";
import { PlaylistIcon } from "@/ui/icons";
import PlaylistContextualMenu from "~/components/contextual-menu/resource/playlist";
import Illustration from "~/components/illustration";
import ListItem from "~/components/list-item";

type PlaylistItemProps = {
	playlist: PlaylistWithRelations<"illustration"> | undefined;
	onClick?: () => void;
};

/**
 * Item for a list of Playlists
 * @param props
 * @returns
 */
const PlaylistItem = ({ playlist, onClick }: PlaylistItemProps) => {
	return (
		<ListItem
			icon={
				<Illustration
					illustration={playlist?.illustration}
					imgProps={{ objectFit: "cover" }}
					quality="low"
					fallback={<PlaylistIcon />}
				/>
			}
			secondTitle={null}
			href={playlist ? `/playlists/${playlist.slug}` : undefined}
			title={playlist?.name}
			onClick={onClick}
			trailing={
				playlist && <PlaylistContextualMenu playlist={playlist} />
			}
		/>
	);
};

export default PlaylistItem;
