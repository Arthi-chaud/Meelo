import { useState } from "react";
import { ReleaseSortingKeys, ReleaseWithAlbum } from "../../models/release";
import { MeeloInfiniteQueryFn } from "../../api/use-query";
import { SortingParameters } from "../../utils/sorting";
import { useRouter } from "next/router";
import Controls from "../controls/controls";
import InfiniteView from "./infinite-view";
import ReleaseItem from "../list-item/release-item";

type InfiniteReleaseViewProps = {
	query: (sort: SortingParameters<typeof ReleaseSortingKeys>) =>
		ReturnType<MeeloInfiniteQueryFn<ReleaseWithAlbum>>,
	light?: boolean;
}

const InfiniteReleaseView = (props: InfiniteReleaseViewProps) => {
	const router = useRouter();
	const [options, setOptions] = useState<Parameters<Parameters<typeof Controls>[0]['onChange']>[0]>();

	return <>
		<Controls
			onChange={setOptions}
			sortingKeys={ReleaseSortingKeys}
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
		/>;
	</>;
};

export default InfiniteReleaseView;
