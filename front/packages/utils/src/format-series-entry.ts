import i18next from "i18next";
import type Artist from "@/models/artist";
import { formatArtists_ } from "./format-artists";

export const formatSeriesEntrySubtitle = (
	entryIndex: number | null,
	entryArtists: Pick<Artist, "name" | "id">[],
) => {
	const formattedArtists =
		entryArtists.length !== 0
			? formatArtists_(entryArtists)
			: i18next.t("compilationArtistLabel");
	if (entryIndex !== null) {
		return `${i18next.t("series.entryIndex", { index: entryIndex })} - ${formattedArtists}`;
	}
	return formattedArtists;
};
