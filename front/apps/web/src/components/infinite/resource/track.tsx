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
import { DefaultItemSize } from "@/models/layout";
import type { SortingParameters } from "@/models/sorting";
import { TrackSortingKeys, type TrackWithRelations } from "@/models/track";
import { Controls } from "~/components/infinite/controls/controls";
import { useLibraryFiltersControl } from "~/components/infinite/controls/filters";
import { useSortControl } from "~/components/infinite/controls/sort";
import InfiniteView from "~/components/infinite/view";
import TrackItem from "~/components/list-item/resource/track";

type QueryProps = {
	libraries?: string[];
} & SortingParameters<typeof TrackSortingKeys>;

type TrackModel = TrackWithRelations<
	"video" | "release" | "song" | "illustration"
>;

type ViewProps = {
	query: (q: QueryProps) => InfiniteQuery<TrackModel>;
	onItemClick?: (track: TrackModel) => void;
	disableSort?: boolean;
};

const InfiniteTrackView = (props: ViewProps) => {
	const [libraryFilter, libraryFilterControl] = useLibraryFiltersControl();
	const [sort, sortControl] = useSortControl({
		sortingKeys: TrackSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
	});
	return (
		<>
			<Controls filters={[libraryFilterControl]} sort={sortControl} />

			<InfiniteView
				itemSize={DefaultItemSize}
				view={"list"}
				query={() =>
					props.query({
						libraries: libraryFilter,
						sortBy: sort.sort,
						order: sort.order,
					})
				}
				renderListItem={(item) => (
					<TrackItem
						track={item}
						// TODO on click, add rest of videos to the queue
						onClick={() => item && props.onItemClick?.(item)}
					/>
				)}
				renderGridItem={() => <></>}
			/>
		</>
	);
};

export default InfiniteTrackView;
