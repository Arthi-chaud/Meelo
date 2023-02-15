import {
	AlbumSortingKeys, AlbumType, AlbumWithRelations
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
		AlbumWithRelations<'artist'>,
		typeof AlbumSortingKeys,
		[type?: AlbumType]
	> & Pick<Parameters<typeof AlbumTile>[0], 'formatSubtitle'>
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
			renderListItem={(item: AlbumWithRelations<'artist'>) => <AlbumItem album={item} key={item.id} formatSubtitle={props.formatSubtitle}/>}
			renderGridItem={(item: AlbumWithRelations<'artist'>) => <AlbumTile album={item} key={item.id} formatSubtitle={props.formatSubtitle}/>}
		/>
	</>;
};

export default InfiniteAlbumView;
