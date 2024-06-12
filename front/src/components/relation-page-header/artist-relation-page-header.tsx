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

import { ArtistWithRelations } from "../../models/artist";
import ArtistContextualMenu from "../contextual-menu/artist-contextual-menu";
import RelationPageHeader from "./relation-page-header";
import ArtistAvatar from "../artist-avatar";

type ArtistRelationPageHeaderProps = {
	artist: ArtistWithRelations<"illustration"> | undefined;
};

const ArtistRelationPageHeader = ({
	artist,
}: ArtistRelationPageHeaderProps) => {
	return (
		<RelationPageHeader
			illustration={
				<ArtistAvatar
					illustration={artist?.illustration}
					quality="medium"
				/>
			}
			title={artist?.name}
			secondTitle={null}
			trailing={artist && <ArtistContextualMenu artist={artist} />}
		/>
	);
};

export default ArtistRelationPageHeader;
