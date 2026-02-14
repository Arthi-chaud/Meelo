import { useState } from "react";
import type { Order } from "@/models/sorting";

export type SelectedSort<SortingKey extends string> = {
	sort: SortingKey;
	order: Order;
};

export type SortControl<SortingKey extends string> = {
	formatItem: (k: SortingKey) => TranslationKey;
	// returns the label of the menu + icon
	buttonLabel: TranslationKey;
	sortingKeys: readonly SortingKey[];
	selected: SelectedSort<SortingKey>;
	onUpdate: (p: { sort: SortingKey; order: Order }) => void;
};

// Hook to get Sorting data to pass to Controls
export const useSortControl = <SortingKey extends string>({
	sortingKeys,
	translate,
	hook,
	onUpdate,
}: {
	hook: () => { sort: SortingKey; order: Order };
	sortingKeys: readonly SortingKey[];
	translate: (s: SortingKey) => TranslationKey;
	onUpdate: SortControl<SortingKey>["onUpdate"];
}) => {
	const hookRes = hook();
	const [sortState, setSortState] = useState(hookRes);
	const control: SortControl<SortingKey> = {
		sortingKeys: sortingKeys,
		selected: sortState,
		buttonLabel: translate(sortState.sort),
		formatItem: (t) => translate(t),
		onUpdate: (p) => {
			onUpdate(p);
			setSortState(p);
		},
	};
	return [sortState, control] as const;
};
