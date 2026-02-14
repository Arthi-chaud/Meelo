import { useTranslation } from "react-i18next";
import type Library from "@/models/library";
import { useFilterControl, useFiltersControl } from "./control";

function useLibraryFilterControl({
	hook,
	onUpdate,
	libraries,
}: {
	hook: () => string | null;
	libraries: Library[] | undefined;
	onUpdate: (l: string | null) => void;
}) {
	const libraryNameBySlug = (s: string) =>
		libraries!.find((l) => l.slug === s)!.name;
	return useFilterControl<string>({
		hook,
		onUpdate,
		formatItem: (s) => libraryNameBySlug(s) as TranslationKey,
		filterKeys: libraries?.map((l) => l.slug),
		buttonLabel: (selected) =>
			selected
				? (libraryNameBySlug(selected) as TranslationKey)
				: "browsing.controls.filter.allLibraries",
		buttonIcon: undefined,
	});
}

function useLibraryFiltersControl({
	hook,
	onUpdate,
	libraries,
}: {
	hook: () => string[];
	libraries: Library[] | undefined;
	onUpdate: (l: string[]) => void;
}) {
	const { t } = useTranslation();
	const libraryNameBySlug = (s: string) =>
		libraries!.find((l) => l.slug === s)!.name;
	return useFiltersControl<string>({
		hook,
		onUpdate,
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
	});
}

export { useLibraryFilterControl, useLibraryFiltersControl };
