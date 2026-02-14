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

import { useRoute } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import { useSortControl as useSortControlBase } from "@/infinite-controls/sort";
import { useViewPreference } from "~/state/view-preferences";
import type { Sorting } from "~/utils/sorting";

export const useSortControl = <SortingKey extends string>({
	sortingKeys,
	translate,
}: {
	sortingKeys: readonly SortingKey[];
	translate: (s: SortingKey) => TranslationKey;
}) => {
	const route = useRoute();
	const [_, setPrefs] = useViewPreference(route.name);
	return useSortControlBase({
		hook: () => {
			const route = useRoute();
			const { sort, order } = useLocalSearchParams<Sorting<SortingKey>>();
			const [prefs] = useViewPreference(route.name);
			return {
				sort: sort ?? prefs.sort?.sortBy ?? sortingKeys[0],
				order: order ?? prefs.sort?.order ?? "asc",
			};
		},
		sortingKeys,
		translate,
		onUpdate: ({ sort: sortBy, order }) => {
			setPrefs((p) => ({ ...p, sort: { order, sortBy } }));
		},
	});
};
