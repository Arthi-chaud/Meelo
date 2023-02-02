import { useRouter } from "next/router";
import { useState } from "react";
import { SongSortingKeys, SongWithRelations } from "../../../models/song";
import Controls, { OptionState } from "../../controls/controls";
import SongItem from "../../list-item/song-item";
import InfiniteView from "../infinite-view";
import InfiniteResourceViewProps from "./infinite-resource-view-props";

const InfiniteSongView = (
	props: InfiniteResourceViewProps<SongWithRelations<'artist'>, typeof SongSortingKeys>
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
			disableLayoutToggle
			defaultLayout={"list"}
		/>
		<InfiniteView
			view={options?.view ?? 'grid'}
			query={() => props.query({
				sortBy: options?.sortBy ?? 'name',
				order: options?.order ?? 'asc',
			})}
			renderListItem={(item: SongWithRelations<'artist'>) => <SongItem song={item} key={item.id} />}
			renderGridItem={(item: SongWithRelations<'artist'>) => <></>}
		/>
	</>;
};

export default InfiniteSongView;
