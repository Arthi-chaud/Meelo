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

import type { InfiniteQuery } from "@/api/query";
import { ArtistSortingKeys, type ArtistWithRelations } from "@/models/artist";
import type { SortingParameters } from "@/models/sorting";
import type Action from "~/components/actions";
import { Controls } from "~/components/infinite/controls/controls";
import { useLibraryFiltersControl } from "~/components/infinite/controls/filters";
import { useLayoutControl } from "~/components/infinite/controls/layout";
import { useSortControl } from "~/components/infinite/controls/sort";
import InfiniteView from "~/components/infinite/view";
import ArtistItem from "~/components/list-item/resource/artist";
import ArtistTile from "~/components/tile/resource/artist";
import { usePrimaryArtistsToggleControl } from "../controls/primary-artists";

type QueryProps = {
	libraries?: string[];
	primaryArtistsOnly?: boolean;
} & SortingParameters<typeof ArtistSortingKeys>;
type ArtistModel = ArtistWithRelations<"illustration">;
type ViewProps = {
	query: (qp: QueryProps) => InfiniteQuery<ArtistModel>;
	disableSort?: boolean;
	enablePrimaryArtistsFilter?: boolean;
	onItemClick?: (p: ArtistModel) => void;
};

const InfiniteArtistView = (props: ViewProps) => {
	const [libraryFilter, libraryFilterControl] = useLibraryFiltersControl();
	const [sort, sortControl] = useSortControl({
		sortingKeys: ArtistSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
	});
	const [layout, layoutControl] = useLayoutControl({
		defaultLayout: "list",
		enableToggle: true,
	});

	const [{ primaryArtistsOnly }, primaryArtistsControl] =
		usePrimaryArtistsToggleControl({
			defaultValue: true,
			enableToggle: props.enablePrimaryArtistsFilter ?? false,
		});
	const primaryArtistsAction: Action = {
		disabled: props.enablePrimaryArtistsFilter !== true,
		onClick: () =>
			primaryArtistsControl.onUpdate({
				primaryArtistsOnly: !primaryArtistsOnly,
			}),
		label: primaryArtistsOnly
			? "browsing.controls.filter.allArtists"
			: "browsing.controls.filter.primaryArtists",
	};

	return (
		<>
			<Controls
				filters={[libraryFilterControl]}
				layout={layoutControl}
				sort={props.disableSort ? undefined : sortControl}
				actions={
					!primaryArtistsAction.disabled
						? [[primaryArtistsAction]]
						: undefined
				}
			/>
			<InfiniteView
				itemSize={layout.itemSize}
				view={layout.layout}
				query={() =>
					props.query({
						libraries: libraryFilter,
						primaryArtistsOnly,
						sortBy: sort.sort,
						order: sort.order,
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
