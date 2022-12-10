import { useState } from "react";
import { MeeloInfiniteQueryFn } from "../../api/use-query";
import { SortingParameters } from "../../utils/sorting";
import { useRouter } from "next/router";
import Controls from "../controls/controls";
import InfiniteView from "./infinite-view";
import Artist, { ArtistSortingKeys } from "../../models/artist";
import ArtistItem from "../list-item/artist-item";
import ArtistTile from "../tile/artist-tile";
import { LayoutOption } from "../../utils/layout";

type InfiniteArtistViewProps = {
	light?: boolean;
	defaultLayout?: LayoutOption;
	query: (sort: SortingParameters<typeof ArtistSortingKeys>) =>
		ReturnType<MeeloInfiniteQueryFn<Artist>>,
}

const InfiniteArtistView = (props: InfiniteArtistViewProps) => {
	const router = useRouter();
	const [options, setOptions] = useState<Parameters<Parameters<typeof Controls>[0]['onChange']>[0]>();

	return <>
		<Controls
			onChange={setOptions}
			sortingKeys={ArtistSortingKeys}
			router={props.light == true ? undefined : router}
			defaultLayout={props.defaultLayout ?? "list"}
		/>
		<InfiniteView
			view={options?.view ?? 'list'}
			query={() => props.query({
				sortBy: options?.sortBy ?? 'name',
				order: options?.order ?? 'asc',
			})}
			renderListItem={(item: Artist) => <ArtistItem artist={item} key={item.id} />}
			renderGridItem={(item: Artist) => <ArtistTile artist={item} key={item.id} />}
		/>;
	</>;
};

export default InfiniteArtistView;
