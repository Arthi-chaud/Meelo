import { useRouter } from "next/router";
import { useState } from "react";
import Artist, { ArtistSortingKeys } from "../../../models/artist";
import Controls, { OptionState } from "../../controls/controls";
import ArtistItem from "../../list-item/artist-item";
import ArtistTile from "../../tile/artist-tile";
import InfiniteView from "../infinite-view";
import InfiniteResourceViewProps from "./infinite-resource-view-props";

const InfiniteArtistView = (
	props: InfiniteResourceViewProps<Artist, typeof ArtistSortingKeys>
) => {
	const router = useRouter();
	const [options, setOptions] = useState<OptionState<typeof ArtistSortingKeys>>();

	return <>
		<Controls
			onChange={setOptions}
			sortingKeys={ArtistSortingKeys}
			defaultSortingOrder={props.initialSortingOrder}
			defaultSortingKey={props.initialSortingField}
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
		/>
	</>;
};

export default InfiniteArtistView;
