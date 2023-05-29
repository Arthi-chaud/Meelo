import { useRouter } from "next/router";
import { useState } from "react";
import { SongSortingKeys } from "../../../models/song";
import { VideoWithRelations } from "../../../models/video";
import Controls, { OptionState } from "../../controls/controls";
import InfiniteView from "../infinite-view";
import InfiniteResourceViewProps from "./infinite-resource-view-props";
import VideoTile from "../../tile/video-tile";

const InfiniteVideoView = (
	props: InfiniteResourceViewProps<VideoWithRelations<'artist'>, typeof SongSortingKeys> & {
		formatSubtitle?: (video: VideoWithRelations<'artist'>) => string
	}
) => {
	const router = useRouter();
	const [options, setOptions] = useState<OptionState<typeof SongSortingKeys>>();

	return <>
		<Controls
			onChange={setOptions}
			sortingKeys={SongSortingKeys}
			defaultSortingOrder={props.initialSortingOrder}
			defaultSortingKey={props.initialSortingField}
			router={props.light == true ? undefined : router}
			defaultLayout={"grid"}
			disableLayoutToggle
		/>
		<InfiniteView
			view={options?.view ?? 'grid'}
			query={() => props.query({
				sortBy: options?.sortBy ?? 'name',
				order: options?.order ?? 'asc',
			})}
			renderListItem={(item: VideoWithRelations<'artist'>) => <></>}
			renderGridItem={(item: VideoWithRelations<'artist'>) =>
				<VideoTile video={{
					...item.track,
					song: item
				}} formatSubtitle={props.formatSubtitle
					? () => (props.formatSubtitle as Required<typeof props>['formatSubtitle'])(item)
					: undefined
				} />
			}
		/>
	</>;
};

export default InfiniteVideoView;
