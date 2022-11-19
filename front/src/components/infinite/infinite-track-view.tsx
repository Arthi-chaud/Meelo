import { useState } from "react";
import {
	TrackSortingKeys, TrackWithRelease, TrackWithSong
} from "../../models/track";
import { MeeloInfiniteQueryFn } from "../../query";
import { SortingParameters } from "../../utils/sorting";
import TrackItem from "../list-item/track-item";
import InfiniteSortableView from "./infinite-sortable-view";

type InfiniteTrackViewProps = {
	query: (sort: SortingParameters<typeof TrackSortingKeys>) =>
		ReturnType<MeeloInfiniteQueryFn<TrackWithRelease & TrackWithSong>>,
	initialSortingOrder?: 'asc' | 'desc',
	initialSortingField?: typeof TrackSortingKeys[number],
}

const InfiniteTrackView = (props: InfiniteTrackViewProps) => {
	const [order, setOrder] = useState(props.initialSortingOrder ?? 'asc');
	const [sortBy, setSortBy] = useState(props.initialSortingField ?? 'name');

	return <InfiniteSortableView
		initialSortingField={sortBy}
		initialSortingOrder={order}
		sortingFields={TrackSortingKeys}
		view={'list'}
		options={[]}
		query={() => props.query({ sortBy, order })}
		renderListItem={(item: TrackWithRelease & TrackWithSong) =>
			<TrackItem track={item} key={item.id} />
		}
		renderGridItem={(item: TrackWithRelease & TrackWithSong) => <></>}
		onSortingFieldSelect={(newField) => setSortBy(newField)}
		onSortingOrderSelect={(newOrder) => setOrder(newOrder)}
	/>;
};

export default InfiniteTrackView;
