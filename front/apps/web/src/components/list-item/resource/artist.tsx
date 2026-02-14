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

import type { ArtistWithRelations } from "@/models/artist";
import ArtistAvatar from "~/components/artist-avatar";
import ArtistContextualMenu from "~/components/contextual-menu/resource/artist";
import ListItem from "~/components/list-item";

type ArtistItemProps = {
	artist: ArtistWithRelations<"illustration"> | undefined;
	onClick?: () => void;
};

/**
 * Item for a list of albums
 * @param props
 * @returns
 */
const ArtistItem = ({ artist, onClick }: ArtistItemProps) => {
	return (
		<ListItem
			icon={
				<ArtistAvatar
					illustration={artist?.illustration}
					quality="low"
				/>
			}
			secondTitle={null}
			onClick={onClick}
			href={artist ? `/artists/${artist.slug}` : undefined}
			title={artist?.name}
			trailing={artist && <ArtistContextualMenu artist={artist} />}
		/>
	);
};

export default ArtistItem;
