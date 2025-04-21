import type { NextPageContext } from "next";
import { useTranslation } from "react-i18next";
import type { GetPropsTypesFrom, Page } from "ssr";
import { getArtists } from "~/api/queries";
import { Head } from "~/components/head";
import {
	getOrderQuery,
	getSortQuery,
} from "~/components/infinite/controls/sort";
import InfiniteArtistView from "~/components/infinite/resource/artist";
import { ArtistSortingKeys } from "~/models/artist";

const prepareSSR = (context: NextPageContext) => {
	const order = getOrderQuery(context) ?? "asc";
	const sortBy = getSortQuery(context, ArtistSortingKeys);

	return {
		infiniteQueries: [getArtists({}, { sortBy, order }, ["illustration"])],
	};
};

const ArtistsPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = () => {
	const { t } = useTranslation();

	return (
		<>
			<Head title={t("artists")} />
			<InfiniteArtistView
				query={({ libraries, sortBy, order }) =>
					getArtists({ library: libraries }, { sortBy, order }, [
						"illustration",
					])
				}
			/>
		</>
	);
};

ArtistsPage.prepareSSR = prepareSSR;

export default ArtistsPage;
