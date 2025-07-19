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

import { useSortControl as useSortControlBase } from "@/infinite-controls/sort";
import type { Order } from "@/models/sorting";
import { useLocalSearchParams } from "expo-router";

export const useSortControl = <SortingKey extends string>({
	sortingKeys,
	translate,
}: {
	sortingKeys: readonly SortingKey[];
	translate: (s: SortingKey) => TranslationKey;
}) => {
	return useSortControlBase({
		hook: () => {
			let { sort, order } = useLocalSearchParams<{
				sort?: SortingKey;
				order?: Order;
			}>();
			sort ??= sortingKeys[0];
			order ??= "asc";
			return { sort, order };
		},
		sortingKeys,
		translate,
		onUpdate: () => {},
	});
};
