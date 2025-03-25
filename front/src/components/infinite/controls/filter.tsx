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
import { useEffect, useState } from "react";
import type { TranslationKey } from "../../../i18n/i18n";
import { parseQueryParam, setQueryParam } from "../../../utils/query-param";

export type FilterControl<Key extends string> = {
	// Gives the translation key from an item to choose from
	formatItem: (k: Key) => TranslationKey;
	values: Key[] | undefined;
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
export const useFiltersControl = <FilterKey extends TranslationKey>({
	defaultFilters,
	filterKeys,
	filterId,
	buttonLabel,
	buttonIcon,
}: {
	buttonLabel: FilterControl<FilterKey>["buttonLabel"];
	buttonIcon: FilterControl<FilterKey>["buttonIcon"];
	defaultFilters: FilterKey[];
	filterKeys: FilterKey[];
	// Used to persist Filter in query param, must be unique
	filterId: string;
}) => {
	// TODO Check layout update does not trigger infinite loop
	const router = useRouter();
	const [filterState, setFilterState] = useState(
		() =>
			(router.query[filterId] as string)
				.split(",")
				.map((f) => parseQueryParam(f, filterKeys))
				.filter((f): f is FilterKey => f !== null) || defaultFilters,
	);
	const control: FilterControl<FilterKey> = {
		values: filterKeys,
		buttonIcon,
		buttonLabel,
		multipleChoice: true,
		selected: filterState,
		formatItem: (t) => t,
		onUpdate: (selected) => setFilterState(selected),
	};
	useEffect(() => {
		setQueryParam(filterId, filterState.join(","), router);
	}, [filterState]);
	return [filterState, setFilterState, control] as const;
};
