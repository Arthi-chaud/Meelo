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

import { useAPI } from "@/api/hook";
import { getLibraries } from "@/api/queries";
import { toTanStackInfiniteQuery } from "@/api/query";
import { useInfiniteQuery as useReactInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useFilterControl, useFiltersControl } from "./control";

function useLibraryFilterControl(p: { multipleChoices: true }): ReturnType<
	typeof useFiltersControl<string>
>;
function useLibraryFilterControl(p: { multipleChoices: false }): ReturnType<
	typeof useFilterControl<string>
>;

function useLibraryFilterControl(p: { multipleChoices: boolean }): never;
function useLibraryFilterControl(p: { multipleChoices: boolean }) {
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
	const libraryNameBySlug = (s: string) =>
		libraries!.find((l) => l.slug === s)!.name;

	if (p.multipleChoices) {
		return useFiltersControl<string>({
			formatItem: (s) => libraryNameBySlug(s) as TranslationKey,
			filterKeys: libraries?.map((l) => l.slug),
			buttonLabel: (selected) => {
				switch (selected.length) {
					case 0:
						return "browsing.controls.filter.allLibraries";
					case 1:
						return libraryNameBySlug(selected[0]) as TranslationKey;
					default:
						return `${selected.length} ${t("models.library_plural")}` as TranslationKey;
				}
			},
			buttonIcon: undefined,
			filterId: "library",
		});
	}

	return useFilterControl<string>({
		formatItem: (s) => libraryNameBySlug(s) as TranslationKey,
		filterKeys: libraries?.map((l) => l.slug),
		buttonLabel: (selected) =>
			selected
				? (libraryNameBySlug(selected) as TranslationKey)
				: "browsing.controls.filter.allLibraries",
		buttonIcon: undefined,
		filterId: "library",
	});
}

export { useLibraryFilterControl };
