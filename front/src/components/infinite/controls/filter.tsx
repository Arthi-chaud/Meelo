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
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useInfiniteQuery as useReactInfiniteQuery } from "react-query";
import API from "../../../api/api";
import { prepareMeeloInfiniteQuery } from "../../../api/use-query";
import type { TranslationKey } from "../../../i18n/i18n";
import { parseQueryParam, setQueryParam } from "../../../utils/query-param";

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
export const useFilterControl = <FilterKey extends string>({
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
		if (!filterKeys) {
			return [];
		}
		if (query === undefined) {
			return [];
		}
		if (typeof query === "string") {
			query = query.split(",");
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

export const useTypeFilterControl = <TypeKey extends TranslationKey>(props: {
	types: readonly TypeKey[];
	filterId?: string;
}) => {
	const { t } = useTranslation();
	return useFilterControl<TypeKey>({
		formatItem: (t: TypeKey) => t,
		filterKeys: props.types,
		buttonLabel: (selected) => {
			switch (selected.length) {
				case 0:
					return "allTypes";
				case 1:
					return selected[0];
				default:
					return `${selected.length} ${t("types")}` as TranslationKey;
			}
		},
		buttonIcon: undefined,
		filterId: props.filterId ?? "type",
	});
};

export const useLibraryFilter = () => {
	const { t } = useTranslation();
	const librariesQuery = useReactInfiniteQuery({
		...prepareMeeloInfiniteQuery(API.getLibraries),
		useErrorBoundary: false,
		onError: () => {
			toast.error(t("librariesLoadFail"));
		},
	});
	const libraries = librariesQuery.data?.pages.at(0)?.items;
	const libraryNameBySlug = (s: string) =>
		libraries!.find((l) => l.slug === s)!.name;

	return useFilterControl<string>({
		formatItem: (s) => libraryNameBySlug(s) as TranslationKey,
		filterKeys: libraries?.map((l) => l.slug),
		buttonLabel: (selected) => {
			switch (selected.length) {
				case 0:
					return "allLibraries";
				case 1:
					return libraryNameBySlug(selected[0]) as TranslationKey;
				default:
					return `${selected.length} ${t("libraries")}` as TranslationKey;
			}
		},
		buttonIcon: undefined,
		filterId: "library",
	});
};
