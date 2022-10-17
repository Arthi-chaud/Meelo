import { useState } from "react";
import Release, { ReleaseSortingKeys, ReleaseWithAlbum } from "../../models/release";
import { MeeloInfiniteQueryFn } from "../../query";
import { SortingParameters } from "../../utils/sorting";
import InfiniteView from "./infinite-view";
import ReleaseItem from "../list-item/release-item";

type InfiniteReleaseViewProps = {
	query: (sort: SortingParameters<typeof ReleaseSortingKeys>) => ReturnType<MeeloInfiniteQueryFn<ReleaseWithAlbum>>,
	initialSortingOrder?: 'asc' | 'desc',
	initialSortingField?: typeof ReleaseSortingKeys[number],
}

const InfiniteReleaseView = (props: InfiniteReleaseViewProps) => {
	const [order, setOrder] = useState(props.initialSortingOrder ?? 'asc');
	const [sortBy, setSortBy] = useState(props.initialSortingField ?? 'name');
	return <InfiniteView
		initialSortingField={sortBy}
		sortingOrder={order}
		sortingFields={ReleaseSortingKeys}
		view={'list'}
		query={() => props.query({ sortBy, order })}
		renderListItem={(item: ReleaseWithAlbum) => <ReleaseItem release={item}/>}
		renderGridItem={(item: ReleaseWithAlbum) => <></>}
		onSortingFieldSelect={(newField) => setSortBy(newField)}
		onSortingOrderSelect={(newOrder) => setOrder(newOrder)}
	/>
}

export default InfiniteReleaseView;