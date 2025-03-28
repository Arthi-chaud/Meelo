import type { NextPageContext } from "next";
import { useTranslation } from "react-i18next";
import API from "../../api/api";
import { Head } from "../../components/head";
import {
	getOrderQuery,
	getSortQuery,
} from "../../components/infinite/controls/sort";
import InfiniteArtistView from "../../components/infinite/infinite-resource-view/infinite-artist-view";
import { ArtistSortingKeys } from "../../models/artist";
import type { GetPropsTypesFrom, Page } from "../../ssr";

const prepareSSR = (context: NextPageContext) => {
	const order = getOrderQuery(context) ?? "asc";
	const sortBy = getSortQuery(context, ArtistSortingKeys);

	return {
		infiniteQueries: [
			API.getArtists({}, { sortBy, order }, ["illustration"]),
		],
	};
};

const ArtistsPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = () => {
	const { t } = useTranslation();

	return (
		<>
			<Head title={t("artists")} />
			<InfiniteArtistView
				query={({ libraries, sortBy, order }) =>
					API.getArtists({ library: libraries }, { sortBy, order }, [
						"illustration",
					])
				}
			/>
		</>
	);
};

ArtistsPage.prepareSSR = prepareSSR;

export default ArtistsPage;
