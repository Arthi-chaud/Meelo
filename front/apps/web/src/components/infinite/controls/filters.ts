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

import { useInfiniteQuery as useReactInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { getLibraries } from "@/api/queries";
import { toTanStackInfiniteQuery } from "@/api/query";
import {
	useLibraryFilterControl as useLibraryFilterControlBase,
	useLibraryFiltersControl as useLibraryFiltersControlBase,
} from "@/infinite-controls/filters/library";
import {
	useTypeFilterControl as useTypeFilterControlBase,
	useTypeFiltersControl as useTypeFiltersControlBase,
} from "@/infinite-controls/filters/resource-type";
import { useAPI } from "~/api";
import { parseQueryParam, setQueryParam } from "~/utils/query-param";

const useLibraryFilterControl = () => {
	const { t } = useTranslation();
	const api = useAPI();
	const query = toTanStackInfiniteQuery(api, getLibraries);
	const librariesQuery = useReactInfiniteQuery({
		...query,
		throwOnError: false,
	});
	useEffect(() => {
		if (librariesQuery.isError) {
			toast.error(t("toasts.library.loadFail"));
		}
	}, [librariesQuery.isError]);
	const libraries = librariesQuery.data?.pages.at(0)?.items;
	const { hook, onUpdate } = useHookAndUpdater(
		libraries?.map(({ slug }) => slug) ?? [],
		"libraries",
	);
	return useLibraryFilterControlBase({ hook, onUpdate, libraries });
};

const useLibraryFiltersControl = () => {
	const { t } = useTranslation();
	const api = useAPI();
	const query = toTanStackInfiniteQuery(api, getLibraries);
	const librariesQuery = useReactInfiniteQuery({
		...query,
		throwOnError: false,
	});
	useEffect(() => {
		if (librariesQuery.isError) {
			toast.error(t("toasts.library.loadFail"));
		}
	}, [librariesQuery.isError]);
	const libraries = librariesQuery.data?.pages.at(0)?.items;
	const { hook, onUpdate } = useHookAndUpdaterForList(
		libraries?.map(({ slug }) => slug) ?? [],
		"libraries",
	);
	return useLibraryFiltersControlBase({ hook, onUpdate, libraries });
};

const useTypeFiltersControl = <FilterKey extends string>({
	types: filterKeys,
	translate,
}: {
	types: readonly FilterKey[];
	translate: (s: FilterKey) => TranslationKey;
}) => {
	const { hook, onUpdate } = useHookAndUpdaterForList(filterKeys, "type");
	return useTypeFiltersControlBase({
		types: filterKeys,
		translate,
		hook,
		onUpdate,
	});
};

const useTypeFilterControl = <FilterKey extends string>({
	types,
	translate,
}: {
	types: readonly FilterKey[];
	translate: (s: FilterKey) => TranslationKey;
}) => {
	const { hook, onUpdate } = useHookAndUpdater(types, "type");
	return useTypeFilterControlBase({
		types,
		translate,
		hook,
		onUpdate,
	});
};

/// Internal, build hook to get query params and fn to update on change

const useHookAndUpdaterForList = <FilterKey extends string>(
	filterKeys: readonly FilterKey[],
	filterId: string,
) => {
	const router = useRouter();
	return {
		hook: () => {
			const router = useRouter();

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
		},

		onUpdate: (selected: FilterKey[]) => {
			setQueryParam(
				[[filterId, selected.length ? selected.join(",") : null]],
				router,
			);
		},
	};
};

const useHookAndUpdater = <FilterKey extends string>(
	filterKeys: readonly FilterKey[],
	filterId: string,
) => {
	const router = useRouter();
	return {
		hook: () => {
			let query = router.query[filterId];
			if (!filterKeys || query === undefined) {
				return null;
			}
			if (typeof query !== "string") {
				query = query[0];
			}
			return parseQueryParam(query, filterKeys);
		},

		onUpdate: (selected: FilterKey | null) => {
			setQueryParam([[filterId, selected ?? null]], router);
		},
	};
};

export {
	useTypeFiltersControl,
	useTypeFilterControl,
	useLibraryFilterControl,
	useLibraryFiltersControl,
};
