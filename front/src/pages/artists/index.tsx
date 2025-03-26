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
		additionalProps: { sortBy, order },
		infiniteQueries: [
			API.getArtists({}, { sortBy, order }, ["illustration"]),
		],
	};
};

const ArtistsPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({ props }) => {
	const { t } = useTranslation();

	return (
		<>
			<Head title={t("artists")} />
			<InfiniteArtistView
				initialSortingField={props?.sortBy}
				initialSortingOrder={props?.order}
				query={({ library, sortBy, order }) =>
					API.getArtists(
						library ? { library } : {},
						{ sortBy, order },
						["illustration"],
					)
				}
			/>
		</>
	);
};

ArtistsPage.prepareSSR = prepareSSR;

export default ArtistsPage;
