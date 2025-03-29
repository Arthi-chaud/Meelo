/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { useRouter } from "next/router";
import { useState } from "react";
import type { TranslationKey } from "~/i18n/i18n";
import { parseQueryParam, setQueryParam } from "~/utils/query-param";

export type FilterControl<Key extends string> = {
	// Gives the translation key from an item to choose from
	formatItem: (k: Key) => TranslationKey;
	values: readonly Key[] | undefined;
	buttonLabel: TranslationKey;
	buttonIcon: JSX.Element | undefined;
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
	filterId,
	buttonLabel,
	buttonIcon,
	formatItem,
}: {
	buttonLabel: (
		selected: FilterKey[],
	) => FilterControl<FilterKey>["buttonLabel"];
	buttonIcon: FilterControl<FilterKey>["buttonIcon"];
	formatItem: FilterControl<FilterKey>["formatItem"];
	filterKeys: readonly FilterKey[] | undefined;
	// Used to persist Filter in query param, must be unique
	filterId: string;
}) => {
	// TODO Check layout update does not trigger infinite loop
	const router = useRouter();
	const [selectedFilters, setFilterState] = useState(() => {
		let query = router.query[filterId];
		if (!filterKeys || query === undefined) {
			return [];
		}
		if (typeof query === "string") {
			query = query.trim().split(",");
		}
		return query
			.map((f) => parseQueryParam(f, filterKeys))
			.filter((f): f is FilterKey => f !== null);
	});
	const control: FilterControl<FilterKey> = {
		values: filterKeys,
		buttonIcon,
		buttonLabel: buttonLabel(selectedFilters),
		multipleChoice: true,
		selected: selectedFilters,
		formatItem: (t: FilterKey) => formatItem(t),
		onUpdate: (selected) => {
			setQueryParam(
				[[filterId, selected.length ? selected.join(",") : null]],
				router,
			);
			setFilterState(selected);
		},
	};
	return [selectedFilters, control] as const;
};

export const useFilterControl = <FilterKey extends string>({
	filterKeys,
	filterId,
	buttonLabel,
	buttonIcon,
	formatItem,
}: {
	buttonLabel: (
		selected: FilterKey | null,
	) => FilterControl<FilterKey>["buttonLabel"];
	buttonIcon: FilterControl<FilterKey>["buttonIcon"];
	formatItem: FilterControl<FilterKey>["formatItem"];
	filterKeys: readonly FilterKey[] | undefined;
	filterId: string;
}) => {
	const router = useRouter();
	const [selectedFilter, setSelectedFilter] = useState(() => {
		let query = router.query[filterId];
		if (!filterKeys || query === undefined) {
			return null;
		}
		if (typeof query !== "string") {
			query = query[0];
		}
		return parseQueryParam(query, filterKeys);
	});
	const control: FilterControl<FilterKey> = {
		values: filterKeys,
		buttonIcon,
		buttonLabel: buttonLabel(selectedFilter),
		multipleChoice: false,
		selected: selectedFilter,
		formatItem: (t: FilterKey) => formatItem(t),
		onUpdate: (selected) => {
			setQueryParam([[filterId, selected ?? null]], router);
			setSelectedFilter(selected);
		},
	};
	return [selectedFilter, control] as const;
};
