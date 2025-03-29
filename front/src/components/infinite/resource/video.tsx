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

import {
	type InfiniteQuery,
	type QueryClient,
	prepareMeeloInfiniteQuery,
	useQueryClient,
} from "api/use-query";
import { PlayIcon, ShuffleIcon } from "components/icons";
import { Controls } from "components/infinite/controls/controls";
import { useLibraryFilterControl } from "components/infinite/controls/filters/library";
import { useTypeFilterControl } from "components/infinite/controls/filters/resource-type";
import { useLayoutControl } from "components/infinite/controls/layout";
import { useSortControl } from "components/infinite/controls/sort";
import InfiniteView from "components/infinite/view";
import VideoItem from "components/list-item/resource/video";
import VideoTile from "components/tile/resource/video";
import {
	VideoSortingKeys,
	VideoType,
	type VideoWithRelations,
} from "models/video";
import { emptyPlaylistAtom, playAfterAtom, playTrackAtom } from "state/player";
import { store } from "state/store";
import type { SortingParameters } from "utils/sorting";

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

	const [libraryFilter, libraryFilterControl] = useLibraryFilterControl({
		multipleChoices: true,
	});
	const [typeFilter, typeFilterControl] = useTypeFilterControl({
		types: VideoType,
		multipleChoices: true,
	});
	const [sort, sortControl] = useSortControl({
		sortingKeys: VideoSortingKeys,
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
		label: "playAll",
		icon: <PlayIcon />,
		onClick: () => {
			playVideosAction(queryClient, () => props.query(query));
		},
	} as const;
	const shuffleAction = {
		label: "shuffle",
		icon: <ShuffleIcon />,
		onClick: () => {
			playVideosAction(queryClient, () =>
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
						onClick={() => item && props.onItemClick?.(item)}
					/>
				)}
				renderGridItem={(item) => (
					<VideoTile
						video={item}
						subtitle={props.subtitle}
						onClick={() => item && props.onItemClick?.(item)}
					/>
				)}
			/>
		</>
	);
};

const playVideosAction = (
	queryClient: QueryClient,
	query: () => InfiniteQuery<
		VideoWithRelations<"artist" | "master" | "illustration">
	>,
) => {
	store.set(emptyPlaylistAtom);
	queryClient.client
		.fetchInfiniteQuery(prepareMeeloInfiniteQuery(query))
		.then(async (res) => {
			const videos = res.pages
				.flatMap(({ items }) => items)
				.map((video) => ({
					...video,
					track: {
						...video.master,
						illustration: video.illustration,
					},
				}));
			let i = 0;
			for (const video of videos) {
				if (i === 0) {
					store.set(playTrackAtom, video);
				} else {
					store.set(playAfterAtom, video);
				}
				i++;
			}
		});
};

export default InfiniteVideoView;
