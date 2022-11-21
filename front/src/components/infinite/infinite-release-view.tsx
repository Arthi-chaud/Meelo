import { useState } from "react";
import { ReleaseSortingKeys, ReleaseWithAlbum } from "../../models/release";
import { MeeloInfiniteQueryFn } from "../../query";
import { SortingParameters } from "../../utils/sorting";
import ReleaseItem from "../list-item/release-item";
import InfiniteSortableView from "./infinite-sortable-view";

type InfiniteReleaseViewProps = {
	query: (sort: SortingParameters<typeof ReleaseSortingKeys>) =>
		ReturnType<MeeloInfiniteQueryFn<ReleaseWithAlbum>>,
	initialSortingOrder?: 'asc' | 'desc',
	initialSortingField?: typeof ReleaseSortingKeys[number],
}

const InfiniteReleaseView = (props: InfiniteReleaseViewProps) => {
	const [order, setOrder] = useState(props.initialSortingOrder ?? 'asc');
	const [sortBy, setSortBy] = useState(props.initialSortingField ?? 'name');

	return <InfiniteSortableView
		sortingFields={ReleaseSortingKeys}
		initialSortingField={sortBy}
		initialSortingOrder={order}
		view={'list'}
		options={[]}
		query={() => props.query({ sortBy, order })}
		renderListItem={(item: ReleaseWithAlbum) => <ReleaseItem release={item}/>}
		renderGridItem={(item: ReleaseWithAlbum) => <></>}
		onSortingFieldSelect={(newField) => setSortBy(newField)}
		onSortingOrderSelect={(newOrder) => setOrder(newOrder)}
	/>;
};

export default InfiniteReleaseView;
