import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { getArea, getLabels } from "@/api/queries";
import { transformPage } from "@/api/query";
import { LabelSortingKeys } from "@/models/label";
import { useQuery } from "~/api";
import { StaticHeader } from "~/components/header";
import { useSortControl } from "~/components/infinite/controls/sort";
import { InfiniteView } from "~/components/infinite/view";
import { LabelItem } from "~/components/item/resource/label";
import { AreaHeader } from "~/components/resource-header";

export default function LabelsList() {
	const [{ sort, order }, sortControl] = useSortControl({
		sortingKeys: LabelSortingKeys,
		translate: (s) => `browsing.controls.sort.${s}`,
	});

	const { area: areaId } = useLocalSearchParams<{
		area?: string;
	}>();
	const { data: area } = useQuery((areaId) => getArea(areaId), areaId);
	const query = useMemo(() => {
		const base = getLabels(
			{ area: areaId },
			{ sortBy: sort ?? "name", order: order ?? "asc" },
			["area"],
		);
		return transformPage(base, (g) => ({ ...g, illustration: null }));
	}, [sort, order, areaId]);

	return (
		<StaticHeader>
			<InfiniteView
				layout={"list"}
				header={
					areaId !== undefined ? (
						<AreaHeader area={area} />
					) : undefined
				}
				controls={{
					sort: sortControl,
				}}
				query={query}
				render={(label) => <LabelItem label={label} />}
			/>
		</StaticHeader>
	);
}
