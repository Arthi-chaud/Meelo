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
	PlaylistSortingKeys,
	type PlaylistWithRelations,
} from "@/models/playlist";
import type { SortingParameters } from "@/models/sorting";
import { useQueryClient } from "~/api";
import { CreatePlaylistAction } from "~/components/actions/playlist";
import type { EmptyStateProps } from "~/components/empty-state";
import { Controls } from "~/components/infinite/controls/controls";
import { useLayoutControl } from "~/components/infinite/controls/layout";
import { useSortControl } from "~/components/infinite/controls/sort";
import InfiniteView from "~/components/infinite/view";
import PlaylistItem from "~/components/list-item/resource/playlist";
import PlaylistTile from "~/components/tile/resource/playlist";

type QueryProps = SortingParameters<typeof PlaylistSortingKeys>;
type PlaylistModel = PlaylistWithRelations<"illustration">;
type ViewProps = {
	query: (qp: QueryProps) => InfiniteQuery<PlaylistModel>;
	onItemClick?: (p: PlaylistModel) => void;
	emptyState?: Partial<EmptyStateProps>;
};
const InfinitePlaylistView = (props: ViewProps) => {
	const queryClient = useQueryClient();
	const [sort, sortControl] = useSortControl({
		sortingKeys: PlaylistSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
	});
	const [layout, layoutControl] = useLayoutControl({
		defaultLayout: "grid",
		enableToggle: true,
	});
	return (
		<>
			<Controls
				sort={sortControl}
				layout={layoutControl}
				actions={[[CreatePlaylistAction(queryClient)]]}
			/>
			<InfiniteView
				emptyState={props.emptyState}
				itemSize={layout.itemSize}
				view={layout.layout}
				query={() =>
					props.query({
						sortBy: sort.sort,
						order: sort.order,
					})
				}
				renderListItem={(item) => (
					<PlaylistItem
						playlist={item}
						onClick={() => item && props.onItemClick?.(item)}
					/>
				)}
				renderGridItem={(item) => (
					<PlaylistTile
						playlist={item}
						onClick={() => item && props.onItemClick?.(item)}
					/>
				)}
			/>
		</>
	);
};

export default InfinitePlaylistView;
