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
import {
	AlbumSortingKeys,
	AlbumType,
	type AlbumWithRelations,
} from "@/models/album";
import type { SortingParameters } from "@/models/sorting";
import { albumTypeToTranslationKey } from "@/models/utils";
import { Controls } from "~/components/infinite/controls/controls";
import {
	useLibraryFiltersControl,
	useTypeFiltersControl,
} from "~/components/infinite/controls/filters";
import { useLayoutControl } from "~/components/infinite/controls/layout";
import { useSortControl } from "~/components/infinite/controls/sort";
import InfiniteView from "~/components/infinite/view";
import AlbumItem from "~/components/list-item/resource/album";
import AlbumTile from "~/components/tile/resource/album";

type QueryProps = {
	types?: AlbumType[];
	libraries?: string[];
} & SortingParameters<typeof AlbumSortingKeys>;

type AlbumModel = AlbumWithRelations<"artist" | "illustration">;

type ViewProps = {
	query: (q: QueryProps) => InfiniteQuery<AlbumModel>;
	onItemClick?: (song: AlbumModel) => void;
	disableShuffle?: boolean;
	disableSort?: boolean;
	formatSubtitle?: Parameters<typeof AlbumItem>[0]["formatSubtitle"];
};

const InfiniteAlbumView = (props: ViewProps) => {
	const [libraryFilter, libraryFilterControl] = useLibraryFiltersControl();
	const [typeFilter, typeFilterControl] = useTypeFiltersControl({
		types: AlbumType,
		translate: (s) => albumTypeToTranslationKey(s, false),
	});
	const [sort, sortControl] = useSortControl({
		sortingKeys: AlbumSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
	});
	const [layout, layoutControl] = useLayoutControl({
		defaultLayout: "grid",
		enableToggle: true,
	});

	return (
		<>
			<Controls
				layout={layoutControl}
				filters={[libraryFilterControl, typeFilterControl]}
				sort={props.disableSort ? undefined : sortControl}
			/>
			<InfiniteView
				itemSize={layout.itemSize}
				view={layout.layout}
				query={() =>
					props.query({
						libraries: libraryFilter,
						types: typeFilter,
						sortBy: sort.sort,
						order: sort.order,
					})
				}
				renderListItem={(item) => (
					<AlbumItem
						onClick={() => item && props.onItemClick?.(item)}
						album={item}
						formatSubtitle={props.formatSubtitle}
					/>
				)}
				renderGridItem={(item) => (
					<AlbumTile
						onClick={() => item && props.onItemClick?.(item)}
						album={item}
						formatSubtitle={props.formatSubtitle}
					/>
				)}
			/>
		</>
	);
};

export default InfiniteAlbumView;
