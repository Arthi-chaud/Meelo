import { useMemo } from "react";
import { getManySeries } from "@/api/queries";
import { transformPage } from "@/api/query";
import { SeriesSortingKeys } from "@/models/series";
import { StaticHeader } from "~/components/header";
import { useSortControl } from "~/components/infinite/controls/sort";
import { InfiniteView } from "~/components/infinite/view";
import { SeriesItem } from "~/components/item/resource/series";

export default function SeriesList() {
	const [{ sort, order }, sortControl] = useSortControl({
		sortingKeys: SeriesSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
	});

	const query = useMemo(() => {
		const base = getManySeries({
			sortBy: sort ?? "name",
			order: order ?? "asc",
		});
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
				render={(series) => <SeriesItem series={series} />}
			/>
		</StaticHeader>
	);
}
