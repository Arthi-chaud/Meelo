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

import { useRouter } from "next/router";
import { useState } from "react";
import {
	ArtistSortingKeys,
	type ArtistWithRelations,
} from "../../../models/artist";
import Controls, { type OptionState } from "../../controls/controls";
import ArtistItem from "../../list-item/artist-item";
import ArtistTile from "../../tile/artist-tile";
import InfiniteView from "../infinite-view";
import type InfiniteResourceViewProps from "./infinite-resource-view-props";

const InfiniteArtistView = (
	props: InfiniteResourceViewProps<
		ArtistWithRelations<"illustration">,
		typeof ArtistSortingKeys
	>,
) => {
	const router = useRouter();
	const [options, setOptions] =
		useState<OptionState<typeof ArtistSortingKeys>>();

	return (
		<>
			<Controls
				onChange={setOptions}
				sortingKeys={ArtistSortingKeys}
				disableSorting={props.disableSorting}
				defaultSortingOrder={props.initialSortingOrder}
				defaultSortingKey={props.initialSortingField}
				router={props.light === true ? undefined : router}
				defaultLayout={props.defaultLayout ?? "list"}
			/>
			<InfiniteView
				itemSize={options?.itemSize ?? "m"}
				view={options?.view ?? props.defaultLayout ?? "list"}
				query={() =>
					props.query({
						library: options?.library ?? null,
						view: options?.view ?? props.defaultLayout ?? "list",
						sortBy:
							options?.sortBy ??
							props.initialSortingField ??
							"name",
						order:
							options?.order ??
							props.initialSortingOrder ??
							"asc",
					})
				}
				renderListItem={(item) => (
					<ArtistItem
						artist={item}
						onClick={() => item && props.onItemClick?.(item)}
					/>
				)}
				renderGridItem={(item) => (
					<ArtistTile
						artist={item}
						onClick={() => item && props.onItemClick?.(item)}
					/>
				)}
			/>
		</>
	);
};

export default InfiniteArtistView;
