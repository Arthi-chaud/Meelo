import { useState } from "react";
import InfiniteResourceViewProps from "./infinite-resource-view-props";
import Controls, { OptionState } from "../../controls/controls";
import { useRouter } from "next/router";
import { ReleaseSortingKeys, ReleaseWithAlbum } from "../../../models/release";
import ReleaseItem from "../../list-item/release-item";
import InfiniteView from "../infinite-view";

const InfiniteReleaseView = (
	props: InfiniteResourceViewProps<
		ReleaseWithAlbum,
		typeof ReleaseSortingKeys
	>
) => {
	const router = useRouter();
	const [options, setOptions] = useState<OptionState<typeof ReleaseSortingKeys>>();

	return <>
		<Controls
			onChange={setOptions}
			sortingKeys={ReleaseSortingKeys}
			defaultSortingOrder={props.initialSortingOrder}
			defaultSortingKey={props.initialSortingField}
			router={props.light == true ? undefined : router}
			disableLayoutToggle
			defaultLayout={"list"}
		/>
		<InfiniteView
			view={options?.view ?? 'list'}
			query={() => props.query({
				sortBy: options?.sortBy ?? 'name',
				order: options?.order ?? 'asc',
			})}
			renderListItem={(item: ReleaseWithAlbum) =>
				<ReleaseItem release={item} key={item.id} />
			}
			renderGridItem={(item: ReleaseWithAlbum) => <></>}
		/>
	</>;
};

export default InfiniteReleaseView;
