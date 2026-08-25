import i18next from "i18next";
import type Artist from "@/models/artist";
import { formatArtists_ } from "./format-artists";

export const formatSeriesEntrySubtitle = (
	entryIndex: number | null,
	entryArtists?: Pick<Artist, "name" | "id">[] | null,
) => {
	const formattedArtists = formatArtists_(entryArtists ?? []);
	if (entryIndex !== null) {
		return `${i18next.t("series.entryIndex", { index: entryIndex })} - ${formattedArtists}`;
	}
	return formattedArtists;
};
