import {
	AlbumSortingKeys, AlbumType, AlbumWithArtist
} from "../../models/album";
import { MeeloInfiniteQueryFn } from "../../api/use-query";
import { SortingParameters } from "../../utils/sorting";
import AlbumItem from "../list-item/album-item";
import AlbumTile from "../tile/album-tile";
import Controls from "../controls/controls";
import InfiniteView from "./infinite-view";
import { capitalCase } from "change-case";
import { useRouter } from "next/router";
import { useState } from "react";
import { LayoutOption } from "../../utils/layout";

type InfiniteAlbumViewProps = {
	light?: boolean;
	defaultLayout?: LayoutOption;
	query: (sort: SortingParameters<typeof AlbumSortingKeys>, type?: AlbumType) =>
		ReturnType<MeeloInfiniteQueryFn<AlbumWithArtist>>,
}

const InfiniteAlbumView = (props: InfiniteAlbumViewProps) => {
	const router = useRouter();
	const [options, setOptions] = useState<Parameters<Parameters<typeof Controls>[0]['onChange']>[0]>();

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
			router={props.light == true ? undefined : router}
			defaultLayout={props.defaultLayout ?? "grid"}
		/>
		<InfiniteView
			view={options?.view ?? 'grid'}
			query={() => props.query({
				sortBy: options?.sortBy ?? 'name',
				order: options?.order ?? 'asc',
			}, options?.type == 'All' ? undefined : options?.type as AlbumType | undefined)}
			renderListItem={(item: AlbumWithArtist) => <AlbumItem album={item} key={item.id} />}
			renderGridItem={(item: AlbumWithArtist) => <AlbumTile album={item} key={item.id} />}
		/>;
	</>;
};

export default InfiniteAlbumView;
