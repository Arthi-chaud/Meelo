import { useState } from "react";
import InfiniteResourceViewProps from "./infinite-resource-view-props";
import Controls, { OptionState } from "../../controls/controls";
import { useRouter } from "next/router";
import {
	TrackSortingKeys, TrackWithRelease, TrackWithSong
} from "../../../models/track";
import TrackItem from "../../list-item/track-item";
import InfiniteView from "../infinite-view";

const InfiniteTrackView = (
	props: InfiniteResourceViewProps<TrackWithRelease & TrackWithSong, typeof TrackSortingKeys>
) => {
	const router = useRouter();
	const [options, setOptions] = useState<OptionState<typeof TrackSortingKeys>>();

	return <>
		<Controls
			onChange={setOptions}
			sortingKeys={TrackSortingKeys}
			defaultSortingOrder={props.initialSortingOrder}
			defaultSortingKey={props.initialSortingField}
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
