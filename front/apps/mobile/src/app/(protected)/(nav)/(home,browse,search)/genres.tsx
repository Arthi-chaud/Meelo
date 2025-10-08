import { useMemo } from "react";
import { getGenres } from "@/api/queries";
import { transformPage } from "@/api/query";
import { GenreSortingKeys } from "@/models/genre";
import { useSortControl } from "~/components/infinite/controls/sort";
import { InfiniteView } from "~/components/infinite/view";
import { GenreItem } from "~/components/item/resource/genre";

export default function GenreList() {
	const [{ sort, order }, sortControl] = useSortControl({
		sortingKeys: GenreSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
	});
	const query = useMemo(() => {
		const base = getGenres(
			{},
			{ sortBy: sort ?? "name", order: order ?? "asc" },
		);
		return transformPage(base, (g) => ({ ...g, illustration: null }));
	}, [sort, order]);

	return (
		<InfiniteView
			layout={"list"}
			controls={{
				sort: sortControl,
			}}
			query={query}
			render={(genre) => <GenreItem genre={genre} />}
		/>
	);
}
