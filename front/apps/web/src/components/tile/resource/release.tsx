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

import type { ReleaseWithRelations } from "@/models/release";
import { AlbumIcon } from "@/ui/icons";
import { getYear } from "@/utils/date";
import ReleaseContextualMenu from "~/components/contextual-menu/resource/release";
import Illustration from "~/components/illustration";
import Tile from "~/components/tile";

const ReleaseTile = (props: {
	release: ReleaseWithRelations<"album" | "illustration"> | undefined;
	formatSubtitle?: (release: ReleaseWithRelations<"album">) => string;
	onClick?: () => void;
}) => {
	const yearFormat = props.release
		? (getYear(props.release.releaseDate)?.toString() ?? "")
		: "";
	return (
		<Tile
			contextualMenu={
				props.release && (
					<ReleaseContextualMenu release={props.release} />
				)
			}
			onClick={props.onClick}
			title={props.release?.name}
			subtitle={
				props.release
					? (props.formatSubtitle?.call(this, props.release) ??
						props.release.extensions.at(0))
						? `${props.release.extensions.at(0)} - ${yearFormat}`
						: yearFormat
					: undefined
			}
			href={props.release ? `/releases/${props.release.slug}` : undefined}
			illustration={
				<Illustration
					illustration={props.release?.illustration}
					quality="medium"
					alignBottom
					fallback={<AlbumIcon />}
				/>
			}
		/>
	);
};

export default ReleaseTile;
