import { useState } from "react";
import { SongSortingKeys, SongWithArtist } from "../../models/song";
import { MeeloInfiniteQueryFn } from "../../api/use-query";
import { SortingParameters } from "../../utils/sorting";
import SongItem from "../list-item/song-item";
import { useRouter } from "next/router";
import Controls from "../controls/controls";
import InfiniteView from "./infinite-view";

type InfiniteSongViewProps = {
	light?: boolean;
	query: (sort: SortingParameters<typeof SongSortingKeys>) =>
		ReturnType<MeeloInfiniteQueryFn<SongWithArtist>>,
}

const InfiniteSongView = (props: InfiniteSongViewProps) => {
	const router = useRouter();
	const [options, setOptions] = useState<Parameters<Parameters<typeof Controls>[0]['onChange']>[0]>();

	return <>
		<Controls
			onChange={setOptions}
			sortingKeys={SongSortingKeys}
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
			renderListItem={(item: SongWithArtist) => <SongItem song={item} key={item.id} />}
			renderGridItem={(item: SongWithArtist) => <></>}
		/>;
	</>;
};

export default InfiniteSongView;
