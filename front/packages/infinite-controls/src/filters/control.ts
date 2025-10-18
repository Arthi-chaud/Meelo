import { type ReactNode, useState } from "react";

export type FilterControl<Key extends string> = {
	// Gives the translation key from an item to choose from
	formatItem: (k: Key) => TranslationKey;
	values: readonly Key[] | undefined;
	buttonLabel: TranslationKey;
	buttonIcon: ReactNode | undefined;
} & (
	| {
			multipleChoice: true;
			selected: Key[];
			onUpdate: (keys: Key[]) => void;
	  }
	| {
			multipleChoice: false;
			selected: Key | null;
			onUpdate: (key: Key | null) => void;
	  }
);

// Control for filter that accept multiple values
export const useFiltersControl = <FilterKey extends string>({
	filterKeys,
	buttonLabel,
	buttonIcon,
	formatItem,
	onUpdate,
	hook,
}: {
	hook: () => FilterKey[];
	buttonLabel: (
		selected: FilterKey[],
	) => FilterControl<FilterKey>["buttonLabel"];
	buttonIcon: FilterControl<FilterKey>["buttonIcon"];
	formatItem: FilterControl<FilterKey>["formatItem"];
	filterKeys: readonly FilterKey[] | undefined;
	onUpdate: (selected: FilterKey[]) => void;
}) => {
	const filters = hook();
	const [selectedFilters, setFilterState] = useState(filters);
	const control: FilterControl<FilterKey> = {
		values: filterKeys,
		buttonIcon,
		buttonLabel: buttonLabel(selectedFilters),
		multipleChoice: true,
		selected: selectedFilters,
		formatItem: (t: FilterKey) => formatItem(t),
		onUpdate: (selected) => {
			onUpdate(selected);
			setFilterState(selected);
		},
	};
	return [selectedFilters, control] as const;
};

export const useFilterControl = <FilterKey extends string>({
	filterKeys,
	buttonLabel,
	buttonIcon,
	formatItem,
	hook,
	onUpdate,
}: {
	buttonLabel: (
		selected: FilterKey | null,
	) => FilterControl<FilterKey>["buttonLabel"];
	buttonIcon: FilterControl<FilterKey>["buttonIcon"];
	formatItem: FilterControl<FilterKey>["formatItem"];
	hook: () => FilterKey | null;
	onUpdate: (selected: FilterKey | null) => void;
	filterKeys: readonly FilterKey[] | undefined;
}) => {
	const filter = hook();
	const [selectedFilter, setSelectedFilter] = useState(filter);
	const control: FilterControl<FilterKey> = {
		values: filterKeys,
		buttonIcon,
		buttonLabel: buttonLabel(selectedFilter),
		multipleChoice: false,
		selected: selectedFilter,
		formatItem: (t: FilterKey) => formatItem(t),
		onUpdate: (selected) => {
			onUpdate(selected ?? null);
			setSelectedFilter(selected);
		},
	};
	return [selectedFilter, control] as const;
};
