import { useState } from "react";
import Album, { AlbumWithArtist, AlbumSortingKeys } from "../../models/album";
import Artist, { ArtistSortingKeys } from "../../models/artist";
import { MeeloInfiniteQueryFn } from "../../query";
import { SortingParameters } from "../../utils/sorting";
import AlbumItem from "../list-item/album-item";
import ArtistItem from "../list-item/artist-item";
import AlbumTile from "../tile/album-tile";
import ArtistTile from "../tile/artist-tile";
import InfiniteView from "./infinite-view";

type InfiniteArtistViewProps = {
	query: (sort: SortingParameters<typeof ArtistSortingKeys>) => ReturnType<MeeloInfiniteQueryFn<Artist>>,
	initialView: 'grid' | 'list',
	initialSortingOrder?: 'asc' | 'desc',
	initialSortingField?: typeof ArtistSortingKeys[number],
}

const InfiniteArtistView = (props: InfiniteArtistViewProps) => {
	const [order, setOrder] = useState(props.initialSortingOrder ?? 'asc');
	const [sortBy, setSortBy] = useState(props.initialSortingField ?? 'name');
	return <InfiniteView
		initialSortingField={sortBy}
		sortingOrder={order}
		sortingFields={ArtistSortingKeys}
		enableToggle
		view={props.initialView}
		query={() => props.query({ sortBy, order })}
		renderListItem={(item: Artist) => <ArtistItem artist={item} key={item.id} />}
		renderGridItem={(item: Artist) => <ArtistTile artist={item} key={item.id} />}
		onSortingFieldSelect={(newField) => setSortBy(newField)}
		onSortingOrderSelect={(newOrder) => setOrder(newOrder)}
	/>
}

export default InfiniteArtistView;