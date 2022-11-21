import { useState } from "react";
import { SongSortingKeys, SongWithArtist } from "../../models/song";
import { MeeloInfiniteQueryFn } from "../../query";
import { SortingParameters } from "../../utils/sorting";
import SongItem from "../list-item/song-item";
import InfiniteSortableView from "./infinite-sortable-view";

type InfiniteSongViewProps = {
	query: (sort: SortingParameters<typeof SongSortingKeys>) =>
		ReturnType<MeeloInfiniteQueryFn<SongWithArtist>>,
	initialSortingOrder?: 'asc' | 'desc',
	initialSortingField?: typeof SongSortingKeys[number],
}

const InfiniteSongView = (props: InfiniteSongViewProps) => {
	const [order, setOrder] = useState(props.initialSortingOrder ?? 'asc');
	const [sortBy, setSortBy] = useState(props.initialSortingField ?? 'name');

	return <InfiniteSortableView
		initialSortingField={sortBy}
		initialSortingOrder={order}
		sortingFields={SongSortingKeys}
		view={'list'}
		options={[]}
		query={() => props.query({ sortBy, order })}
		renderListItem={(item: SongWithArtist) => <SongItem song={item} key={item.id} />}
		renderGridItem={(item: SongWithArtist) => <></>}
		onSortingFieldSelect={(newField) => setSortBy(newField)}
		onSortingOrderSelect={(newOrder) => setOrder(newOrder)}/>;
};

export default InfiniteSongView;
