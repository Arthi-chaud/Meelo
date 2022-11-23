import { useState } from "react";
import Artist, { ArtistSortingKeys } from "../../models/artist";
import { MeeloInfiniteQueryFn } from "../../api/use-query";
import { SortingParameters } from "../../utils/sorting";
import ArtistItem from "../list-item/artist-item";
import ArtistTile from "../tile/artist-tile";
import InfiniteSortableView from "./infinite-sortable-view";

type InfiniteArtistViewProps = {
	query: (sort: SortingParameters<typeof ArtistSortingKeys>) =>
		ReturnType<MeeloInfiniteQueryFn<Artist>>,
	initialView: 'grid' | 'list',
	initialSortingOrder?: 'asc' | 'desc',
	initialSortingField?: typeof ArtistSortingKeys[number],
}

const InfiniteArtistView = (props: InfiniteArtistViewProps) => {
	const [order, setOrder] = useState(props.initialSortingOrder ?? 'asc');
	const [sortBy, setSortBy] = useState(props.initialSortingField ?? 'name');

	return <InfiniteSortableView
		sortingFields={ArtistSortingKeys}
		initialSortingField={sortBy}
		initialSortingOrder={order}
		onSortingFieldSelect={setSortBy}
		onSortingOrderSelect={setOrder}
		enableToggle
		options={[]}
		view={props.initialView}
		query={() => props.query({ sortBy, order })}
		renderListItem={(item: Artist) => <ArtistItem artist={item} key={item.id} />}
		renderGridItem={(item: Artist) => <ArtistTile artist={item} key={item.id} />}
	/>;
};

export default InfiniteArtistView;
