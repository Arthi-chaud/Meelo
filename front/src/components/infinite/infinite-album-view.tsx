import { useState } from "react";
import Album, { AlbumWithArtist, AlbumSortingKeys } from "../../models/album";
import { MeeloInfiniteQueryFn } from "../../query";
import { SortingParameters } from "../../utils/sorting";
import AlbumItem from "../list-item/album-item";
import AlbumTile from "../tile/album-tile";
import InfiniteView from "./infinite-view";
import { AlbumType } from '../../models/album';
import { capitalCase } from "change-case";
import { off } from "process";
import InfiniteSortableView from "./infinite-sortable-view";

type InfiniteAlbumViewProps = {
	query: (sort: SortingParameters<typeof AlbumSortingKeys>, type?: AlbumType) => ReturnType<MeeloInfiniteQueryFn<AlbumWithArtist>>,
	initialView: 'grid' | 'list',
	initialSortingOrder?: 'asc' | 'desc',
	initialSortingField?: typeof AlbumSortingKeys[number],
}

const InfiniteAlbumView = (props: InfiniteAlbumViewProps) => {
	const [order, setOrder] = useState(props.initialSortingOrder ?? 'asc');
	const [sortBy, setSortBy] = useState(props.initialSortingField ?? 'name');
	const [type, setType] = useState<AlbumType | 'All'>('All');
	return <InfiniteSortableView
		enableToggle
		view={props.initialView}
		options={[
			{
				name: capitalCase(type ?? 'All'),
				options: [
					{ name: 'type', values: ['All', ...AlbumType], initValue: type, onSelect: (newType) => setType(newType as AlbumType) },
				],
			}
		]}
		sortingFields={AlbumSortingKeys}
		initialSortingField={sortBy}
		initialSortingOrder={order}
		onSortingFieldSelect={setSortBy}
		onSortingOrderSelect={setOrder}
		query={() => props.query({ sortBy, order }, type == 'All' ? undefined : type)}
		renderListItem={(item: AlbumWithArtist) => <AlbumItem album={item} key={item.id} />}
		renderGridItem={(item: AlbumWithArtist) => <AlbumTile album={item} key={item.id} />}
	/>
}

export default InfiniteAlbumView;