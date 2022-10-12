import { useState } from "react";
import Song, { SongWithArtist, SongSortingKeys } from "../../models/song";
import { MeeloInfiniteQueryFn } from "../../query";
import { SortingParameters } from "../../utils/sorting";
import SongItem from "../list-item/song-item";
import InfiniteView from "./infinite-view";

type InfiniteSongViewProps = {
	query: (sort: SortingParameters<typeof SongSortingKeys>) => ReturnType<MeeloInfiniteQueryFn<SongWithArtist>>,
	initialSortingOrder?: 'asc' | 'desc',
	initialSortingField?: typeof SongSortingKeys[number],
}

const InfiniteSongView = (props: InfiniteSongViewProps) => {
	const [order, setOrder] = useState(props.initialSortingOrder ?? 'asc');
	const [sortBy, setSortBy] = useState(props.initialSortingField ?? 'name');
	return <InfiniteView
		initialSortingField={sortBy}
		sortingOrder={order}
		sortingFields={SongSortingKeys}
		view={'list'}
		query={() => props.query({ sortBy, order })}
		renderListItem={(item: SongWithArtist) => <SongItem song={item} key={item.id} />}
		renderGridItem={(item: SongWithArtist) => <></>}
		onSortingFieldSelect={(newField) => setSortBy(newField)}
		onSortingOrderSelect={(newOrder) => setOrder(newOrder)}
	/>
}

export default InfiniteSongView;