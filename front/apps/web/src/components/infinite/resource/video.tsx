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

import type { QueryClient } from "@/api/hook";
import { type InfiniteQuery, transformPage } from "@/api/query";
import type { SortingParameters } from "@/models/sorting";
import { videoTypeToTranslationKey } from "@/models/utils";
import {
	VideoSortingKeys,
	VideoType,
	type VideoWithRelations,
} from "@/models/video";
import { playFromInfiniteQuery } from "@/state/player";
import { store } from "@/state/store";
import { PlayIcon, ShuffleIcon } from "@/ui/icons";
import { useQueryClient } from "~/api";
import { Controls } from "~/components/infinite/controls/controls";
import {
	useLibraryFiltersControl,
	useTypeFiltersControl,
} from "~/components/infinite/controls/filters";
import { useLayoutControl } from "~/components/infinite/controls/layout";
import { useSortControl } from "~/components/infinite/controls/sort";
import InfiniteView from "~/components/infinite/view";
import VideoItem from "~/components/list-item/resource/video";
import VideoTile from "~/components/tile/resource/video";

type QueryProps = {
	types?: VideoType[];
	libraries?: string[];
	random?: number;
} & SortingParameters<typeof VideoSortingKeys>;

type VideoModel = VideoWithRelations<"artist" | "illustration" | "master">;

type ViewProps = {
	query: (qp: QueryProps) => InfiniteQuery<VideoModel>;
	onItemClick?: (video: VideoModel) => void;
	disableSort?: boolean;
	subtitle: Parameters<typeof VideoTile>[0]["subtitle"];
};

const InfiniteVideoView = (props: ViewProps) => {
	const queryClient = useQueryClient();

	const [libraryFilter, libraryFilterControl] = useLibraryFiltersControl();
	const [typeFilter, typeFilterControl] = useTypeFiltersControl({
		types: VideoType,
		translate: (s) => videoTypeToTranslationKey(s, false),
	});
	const [sort, sortControl] = useSortControl({
		sortingKeys: VideoSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
	});
	const [layout, layoutControl] = useLayoutControl({
		defaultLayout: "grid",
		enableToggle: true,
	});
	const query = {
		libraries: libraryFilter,
		types: typeFilter,
		sortBy: sort.sort,
		order: sort.order,
	};

	const playAction = {
		label: "actions.playback.playAll",
		icon: <PlayIcon />,
		onClick: () => {
			playVideosAction(queryClient, props.query(query));
		},
	} as const;
	const shuffleAction = {
		label: "actions.playback.shuffle",
		icon: <ShuffleIcon />,
		onClick: () => {
			playVideosAction(
				queryClient,
				props.query({
					...query,
					random: Math.floor(Math.random() * 10000),
				}),
			);
		},
	} as const;
	return (
		<>
			<Controls
				filters={[libraryFilterControl, typeFilterControl]}
				sort={props.disableSort ? undefined : sortControl}
				layout={layoutControl}
				actions={[[playAction, shuffleAction]]}
			/>
			<InfiniteView
				itemSize={layout.itemSize}
				view={layout.layout}
				query={() => props.query(query)}
				renderListItem={(item) => (
					<VideoItem
						video={item}
						// TODO Subtitle
						// TODO on click, add rest of videos to the queue
						onClick={() => item && props.onItemClick?.(item)}
					/>
				)}
				renderGridItem={(item) => (
					<VideoTile
						video={item}
						subtitle={props.subtitle}
						// TODO on click, add rest of videos to the queue
						onClick={() => item && props.onItemClick?.(item)}
					/>
				)}
			/>
		</>
	);
};

const playVideosAction = (
	queryClient: QueryClient,
	query: InfiniteQuery<
		VideoWithRelations<"artist" | "master" | "illustration">
	>,
) => {
	store.set(
		playFromInfiniteQuery,
		transformPage(query, (video) => ({
			...video,
			track: {
				...video.master,
				illustration: video.illustration,
			},
			featuring: undefined,
			id: video.id,
		})),
		queryClient,
	);
};

export default InfiniteVideoView;
