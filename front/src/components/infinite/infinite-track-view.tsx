import { useState } from "react";
import {
	TrackSortingKeys, TrackWithRelease, TrackWithSong
} from "../../models/track";
import { MeeloInfiniteQueryFn } from "../../api/use-query";
import { SortingParameters } from "../../utils/sorting";
import TrackItem from "../list-item/track-item";
import { useRouter } from "next/router";
import Controls from "../controls/controls";
import InfiniteView from "./infinite-view";

type InfiniteTrackViewProps = {
	query: (sort: SortingParameters<typeof TrackSortingKeys>) =>
		ReturnType<MeeloInfiniteQueryFn<TrackWithRelease & TrackWithSong>>,
	light?: boolean;
}

const InfiniteTrackView = (props: InfiniteTrackViewProps) => {
	const router = useRouter();
	const [options, setOptions] = useState<Parameters<Parameters<typeof Controls>[0]['onChange']>[0]>();

	return <>
		<Controls
			onChange={setOptions}
			sortingKeys={TrackSortingKeys}
			router={props.light == true ? undefined : router}
			disableLayoutToggle
			defaultLayout={"list"}
		/>
		<InfiniteView
			view={options?.view ?? 'list'}
			query={() => props.query({
				sortBy: options?.sortBy ?? 'name',
				order: options?.order ?? 'asc',
			})}
			renderListItem={(item: TrackWithRelease & TrackWithSong) =>
				<TrackItem track={item} key={item.id} />
			}
			renderGridItem={(item: TrackWithRelease & TrackWithSong) => <></>}
		/>;
	</>;
};

export default InfiniteTrackView;
