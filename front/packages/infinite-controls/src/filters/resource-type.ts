import { useTranslation } from "react-i18next";
import { useFilterControl, useFiltersControl } from "./control";

type TypeFilterControlArg<TypeKey extends string> = {
	types: readonly TypeKey[];
	translate: (s: TypeKey) => TranslationKey;
};

function useTypeFiltersControl<TypeKey extends string>(
	props: TypeFilterControlArg<TypeKey> & {
		hook: () => TypeKey[];
		onUpdate: (t: TypeKey[]) => any;
	},
) {
	const { t } = useTranslation();
	return useFiltersControl<TypeKey>({
		hook: props.hook,
		onUpdate: props.onUpdate,
		formatItem: (t: TypeKey) => props.translate(t),
		filterKeys: props.types,
		buttonLabel: (selected) => {
			switch (selected.length) {
				case 0:
					return "browsing.controls.filter.allTypes";
				case 1:
					return props.translate(selected[0]);
				default:
					return t("browsing.controls.filter.nTypes", {
						n: selected.length,
					}) as TranslationKey;
			}
		},
		buttonIcon: undefined,
	});
}

function useTypeFilterControl<TypeKey extends string>(
	props: TypeFilterControlArg<TypeKey> & {
		hook: () => TypeKey | null;
		onUpdate: (t: TypeKey | null) => any;
	},
) {
	return useFilterControl<TypeKey>({
		hook: props.hook,
		onUpdate: props.onUpdate,
		formatItem: (t: TypeKey) => props.translate(t),
		filterKeys: props.types,
		buttonLabel: (selected) =>
			selected
				? props.translate(selected)
				: "browsing.controls.filter.allTypes",
		buttonIcon: undefined,
	});
}

export { useTypeFilterControl, useTypeFiltersControl };
