import {
	AlbumSortingKeys, AlbumType, AlbumWithArtist
} from "../../../models/album";
import AlbumItem from "../../list-item/album-item";
import AlbumTile from "../../tile/album-tile";
import Controls, { OptionState } from "../../controls/controls";
import InfiniteView from "../infinite-view";
import { capitalCase } from "change-case";
import { useRouter } from "next/router";
import { useState } from "react";
import InfiniteResourceViewProps from "./infinite-resource-view-props";

const InfiniteAlbumView = (
	props: InfiniteResourceViewProps<
		AlbumWithArtist,
		typeof AlbumSortingKeys,
		[type?: AlbumType]
	>
) => {
	const router = useRouter();
	const [options, setOptions] = useState<OptionState<typeof AlbumSortingKeys>>();

	return <>
		<Controls
			options={[
				{
					label: capitalCase(options?.type ?? 'All'),
					name: 'type',
					values: ['All', ...AlbumType],
					currentValue: options?.type,
				}
			]}
			onChange={setOptions}
			sortingKeys={AlbumSortingKeys}
			defaultSortingOrder={props.initialSortingOrder}
			defaultSortingKey={props.initialSortingField}
			router={props.light == true ? undefined : router}
			defaultLayout={props.defaultLayout ?? "grid"}
		/>
		<InfiniteView
			view={options?.view ?? props.defaultLayout ?? "grid"}
			query={() => props.query({
				sortBy: options?.sortBy ?? AlbumSortingKeys[0],
				order: options?.order ?? 'asc',
			}, options?.type == 'All' ? undefined : options?.type as AlbumType | undefined)}
			renderListItem={(item: AlbumWithArtist) => <AlbumItem album={item} key={item.id} />}
			renderGridItem={(item: AlbumWithArtist) => <AlbumTile album={item} key={item.id} />}
		/>
	</>;
};

export default InfiniteAlbumView;