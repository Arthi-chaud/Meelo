import { getLibraries } from "@/api/queries";
import { toTanStackInfiniteQuery } from "@/api/query";
import {
	useTypeFilterControl as useTypeFilterControlBase,
	useTypeFiltersControl as useTypeFiltersControlBase,
} from "@/infinite-controls/filters/resource-type";

import {
	useLibraryFilterControl as useLibraryFilterControlBase,
	useLibraryFiltersControl as useLibraryFiltersControlBase,
} from "@/infinite-controls/filters/library";
import { useInfiniteQuery as useReactInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Toast } from "toastify-react-native";
import { useAPI } from "~/api";
import { useLocalSearchParams } from "expo-router";

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
			Toast.error(t("toasts.library.loadFail"));
		}
	}, [librariesQuery.isError]);
	const libraries = librariesQuery.data?.pages.at(0)?.items;
	return useLibraryFilterControlBase({
		hook: () => null,
		onUpdate: () => {},
		libraries,
	});
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
			Toast.error(t("toasts.library.loadFail"));
		}
	}, [librariesQuery.isError]);
	const libraries = librariesQuery.data?.pages.at(0)?.items;
	return useLibraryFiltersControlBase({
		hook: () => [],
		onUpdate: () => {},
		libraries,
	});
};

const useTypeFiltersControl = <FilterKey extends string>({
	types: filterKeys,
	translate,
}: {
	types: readonly FilterKey[];
	translate: (s: FilterKey) => TranslationKey;
}) => {
	return useTypeFiltersControlBase({
		types: filterKeys,
		translate,
		hook: () => {
			const { type } = useLocalSearchParams<{ type?: FilterKey }>();
			return type ? [type] : [];
		},
		onUpdate: () => {},
	});
};

const useTypeFilterControl = <FilterKey extends string>({
	types,
	translate,
}: {
	types: readonly FilterKey[];
	translate: (s: FilterKey) => TranslationKey;
}) => {
	return useTypeFilterControlBase({
		types,
		translate,
		hook: () => {
			const { type } = useLocalSearchParams<{ type?: FilterKey }>();
			return type ?? null;
		},
		onUpdate: () => {},
	});
};

export {
	useTypeFiltersControl,
	useTypeFilterControl,
	useLibraryFilterControl,
	useLibraryFiltersControl,
};
