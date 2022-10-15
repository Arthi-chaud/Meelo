import { useState } from "react";
import Track, { TrackSortingKeys, TrackWithRelease, TrackWithSong } from "../../models/track";
import { MeeloInfiniteQueryFn } from "../../query";
import { SortingParameters } from "../../utils/sorting";
import TrackItem from "../list-item/track-item";
import InfiniteView from "./infinite-view";

type InfiniteTrackViewProps = {
	query: (sort: SortingParameters<typeof TrackSortingKeys>) => ReturnType<MeeloInfiniteQueryFn<TrackWithRelease>>,
	initialSortingOrder?: 'asc' | 'desc',
	initialSortingField?: typeof TrackSortingKeys[number],
}

const InfiniteTrackView = (props: InfiniteTrackViewProps) => {
	const [order, setOrder] = useState(props.initialSortingOrder ?? 'asc');
	const [sortBy, setSortBy] = useState(props.initialSortingField ?? 'name');
	return <InfiniteView
		initialSortingField={sortBy}
		sortingOrder={order}
		sortingFields={TrackSortingKeys}
		view={'list'}
		query={() => props.query({ sortBy, order })}
		renderListItem={(item: TrackWithRelease) => <TrackItem track={item} key={item.id} />}
		renderGridItem={(item: TrackWithRelease) => <></>}
		onSortingFieldSelect={(newField) => setSortBy(newField)}
		onSortingOrderSelect={(newOrder) => setOrder(newOrder)}
	/>
}

export default InfiniteTrackView;