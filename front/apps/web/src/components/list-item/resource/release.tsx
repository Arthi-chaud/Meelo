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

import { Grid } from "@mui/material";
import type { ReleaseWithRelations } from "@/models/release";
import { AlbumIcon, MasterIcon } from "@/ui/icons";
import { getYear } from "@/utils/date";
import ReleaseContextualMenu from "~/components/contextual-menu/resource/release";
import Illustration from "~/components/illustration";
import ListItem from "~/components/list-item";

type ReleaseItemProps = {
	release: ReleaseWithRelations<"album" | "illustration">;
	onClick?: () => void;
};

const ReleaseItem = ({ release, onClick }: ReleaseItemProps) => {
	const isMaster = release.id === release.album.masterId;

	return (
		<ListItem
			key={release.id}
			icon={
				<Illustration
					illustration={release.illustration}
					quality="low"
					fallback={<AlbumIcon />}
				/>
			}
			href={`/releases/${release.slug}`}
			title={release.name}
			onClick={onClick}
			secondTitle={getYear(release.releaseDate)?.toString()}
			trailing={
				<Grid
					container
					spacing={1}
					sx={{ justifyContent: "flex-end", flexWrap: "nowrap" }}
				>
					<Grid sx={{ display: "flex", alignItems: "center" }}>
						{isMaster ? <MasterIcon /> : undefined}
					</Grid>
					<Grid>{<ReleaseContextualMenu release={release} />}</Grid>
				</Grid>
			}
		/>
	);
};

export default ReleaseItem;
