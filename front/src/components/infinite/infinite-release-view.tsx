import { useState } from "react";
import Release, { ReleaseSortingKeys, ReleaseWithAlbum } from "../../models/release";
import { MeeloInfiniteQueryFn } from "../../query";
import { SortingParameters } from "../../utils/sorting";
import AlbumItem from "../list-item/album-item";
import AlbumTile from "../tile/album-tile";
import InfiniteView from "./infinite-view";
import ListItem from "../list-item/item";
import { Typography } from "@mui/material";
import { Album, Star } from "@mui/icons-material";
import ListItemButton from "../list-item/item-button";
import Illustration from "../illustration";

type InfiniteReleaseViewProps = {
	query: (sort: SortingParameters<typeof ReleaseSortingKeys>) => ReturnType<MeeloInfiniteQueryFn<Release>>,
	initialSortingOrder?: 'asc' | 'desc',
	initialSortingField?: typeof ReleaseSortingKeys[number],
}

const InfiniteAlbumView = (props: InfiniteReleaseViewProps) => {
	const [order, setOrder] = useState(props.initialSortingOrder ?? 'asc');
	const [sortBy, setSortBy] = useState(props.initialSortingField ?? 'name');
	return <InfiniteView
		initialSortingField={sortBy}
		sortingOrder={order}
		sortingFields={ReleaseSortingKeys}
		view={'list'}
		query={() => props.query({ sortBy, order })}
		renderListItem={(item: Release) => <ListItem key={item.id}
			icon={<Illustration url={item.illustration} fallback={<Album/>}/>}
			title={<ListItemButton
				url={`/releases/${item.id}`}
				label={item.name}
			/>}
			secondTitle={item.releaseDate
				? <Typography>{new Date(item.releaseDate).getFullYear()}</Typography>
				: undefined
			}
			trailing={ item.master ? <Star/> : undefined }
		/>}
		renderGridItem={(item: Release) => <></>}
		onSortingFieldSelect={(newField) => setSortBy(newField)}
		onSortingOrderSelect={(newOrder) => setOrder(newOrder)}
	/>
}

export default InfiniteAlbumView;