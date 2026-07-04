import i18next from "i18next";

export const formatLabelDates = (
	startDate: string | Date | null | undefined,
	endDate: string | Date | null | undefined,
) => {
	if (!startDate) {
		return null;
	}
	const startYear = new Date(startDate).getFullYear().toString();
	if (!endDate) {
		return i18next.t("labels.foundedIn", { startYear });
	}
	const endYear = new Date(endDate).getFullYear().toString();
	return `${startYear} - ${endYear}`;
};
