import { useState } from "react";
import Album, { AlbumWithArtist, AlbumSortingKeys } from "../../models/album";
import { MeeloInfiniteQueryFn } from "../../query";
import { SortingParameters } from "../../utils/sorting";
import AlbumItem from "../list-item/album-item";
import AlbumTile from "../tile/album-tile";
import InfiniteView from "./infinite-view";

type InfiniteAlbumViewProps = {
	query: (sort: SortingParameters<typeof AlbumSortingKeys>) => ReturnType<MeeloInfiniteQueryFn<AlbumWithArtist>>,
	initialView: 'grid' | 'list',
	initialSortingOrder?: 'asc' | 'desc',
	initialSortingField?: typeof AlbumSortingKeys[number],
}

const InfiniteAlbumView = (props: InfiniteAlbumViewProps) => {
	const [order, setOrder] = useState(props.initialSortingOrder ?? 'asc');
	const [sortBy, setSortBy] = useState(props.initialSortingField ?? 'name');
	return <InfiniteView
		initialSortingField={sortBy}
		sortingOrder={order}
		sortingFields={AlbumSortingKeys}
		enableToggle
		view={props.initialView}
		query={() => props.query({ sortBy, order })}
		renderListItem={(item: AlbumWithArtist) => <AlbumItem album={item} key={item.id} />}
		renderGridItem={(item: AlbumWithArtist) => <AlbumTile album={item} key={item.id} />}
		onSortingFieldSelect={(newField) => setSortBy(newField)}
		onSortingOrderSelect={(newOrder) => setOrder(newOrder)}
	/>
}

export default InfiniteAlbumView;