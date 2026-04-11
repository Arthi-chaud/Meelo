import { useMemo } from "react";
import { getLabels } from "@/api/queries";
import { transformPage } from "@/api/query";
import { LabelSortingKeys } from "@/models/label";
import { StaticHeader } from "~/components/header";
import { useSortControl } from "~/components/infinite/controls/sort";
import { InfiniteView } from "~/components/infinite/view";
import { LabelItem } from "~/components/item/resource/label";

export default function LabelsList() {
	const [{ sort, order }, sortControl] = useSortControl({
		sortingKeys: LabelSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
	});
	const query = useMemo(() => {
		const base = getLabels(
			{},
			{ sortBy: sort ?? "name", order: order ?? "asc" },
		);
		return transformPage(base, (g) => ({ ...g, illustration: null }));
	}, [sort, order]);

	return (
		<StaticHeader>
			<InfiniteView
				layout={"list"}
				controls={{
					sort: sortControl,
				}}
				query={query}
				render={(label) => <LabelItem label={label} />}
			/>
		</StaticHeader>
	);
}
