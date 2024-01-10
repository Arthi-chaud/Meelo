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
import Illustration from "../illustration";
import { ReleaseWithRelations } from "../../models/release";
import getYear from "../../utils/getYear";
import ReleaseContextualMenu from "../contextual-menu/release-contextual-menu";

const ReleaseTile = (props: {
	release: ReleaseWithRelations<"album">;
	formatSubtitle?: (release: ReleaseWithRelations<"album">) => string;
}) => {
	return (
		<Tile
			contextualMenu={<ReleaseContextualMenu release={props.release} />}
			title={props.release.name}
			subtitle={
				props.formatSubtitle?.call(this, props.release) ??
				getYear(props.release.releaseDate)?.toString()
			}
			href={`/releases/${props.release.id}`}
			illustration={
				<Illustration
					illustration={props.release.illustration}
					quality="medium"
				/>
			}
		/>
	);
};

export default ReleaseTile;
