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

import { useTranslation } from "react-i18next";
import type { TranslationKey } from "../../../../i18n/i18n";
import { useFilterControl, useFiltersControl } from "./control";

type TypeFilterControlArg<TypeKey extends TranslationKey> = {
	types: readonly TypeKey[];
	filterId?: string;
};

function useTypeFilterControl<T extends TranslationKey>(
	p: TypeFilterControlArg<T> & {
		multipleChoices: true;
	},
): ReturnType<typeof useFiltersControl<T>>;
function useTypeFilterControl<T extends TranslationKey>(
	p: TypeFilterControlArg<T> & {
		multipleChoices: false;
	},
): ReturnType<typeof useFilterControl<T>>;
function useTypeFilterControl<T extends TranslationKey>(
	p: TypeFilterControlArg<T> & { multipleChoices: boolean },
): never;
function useTypeFilterControl<TypeKey extends TranslationKey>(
	props: TypeFilterControlArg<TypeKey> & {
		multipleChoices: boolean;
	},
) {
	const { t } = useTranslation();

	if (props.multipleChoices) {
		return useFiltersControl<TypeKey>({
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
	}

	return useFilterControl<TypeKey>({
		formatItem: (t: TypeKey) => t,
		filterKeys: props.types,
		buttonLabel: (selected) => selected ?? "allTypes",
		buttonIcon: undefined,
		filterId: props.filterId ?? "type",
	});
}

export { useTypeFilterControl };
