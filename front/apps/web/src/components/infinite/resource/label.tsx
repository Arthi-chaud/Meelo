import { Box } from "@mui/material";
import type { InfiniteQuery } from "@/api/query";
import type { IllustratedResource } from "@/models/illustration";
import type Label from "@/models/label";
import { LabelSortingKeys } from "@/models/label";
import type { SortingParameters } from "@/models/sorting";
import { LabelTile } from "~/components/tile/resource/label";
import { Controls } from "../controls/controls";
import { useSortControl } from "../controls/sort";
import InfiniteGrid from "../grid";

type QueryProps = SortingParameters<typeof LabelSortingKeys>;
type Props = { query: (qp: QueryProps) => InfiniteQuery<Label> };

export const InfiniteLabelView = (props: Props) => {
	const [sort, sortControl] = useSortControl({
		sortingKeys: LabelSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
	});
	return (
		<>
			<Controls sort={sortControl} />
			<InfiniteGrid
				itemSize={"xl"}
				render={(label) => (
					<Box sx={{ padding: 3 }}>
						<LabelTile label={label} />
					</Box>
				)}
				query={() =>
					props.query({
						sortBy: sort.sort,
						order: sort.order,
					}) as unknown as InfiniteQuery<Label & IllustratedResource>
				}
			/>
		</>
	);
};
