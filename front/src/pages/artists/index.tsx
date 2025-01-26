import API from "../../api/api";
import { ArtistSortingKeys } from "../../models/artist";
import { getOrderParams, getSortingFieldParams } from "../../utils/sorting";
import type { GetPropsTypesFrom, Page } from "../../ssr";
import { useRouter } from "next/router";
import InfiniteArtistView from "../../components/infinite/infinite-resource-view/infinite-artist-view";
import { getLayoutParams } from "../../utils/layout";
import type { NextPageContext } from "next";
import { Head } from "../../components/head";
import { useTranslation } from "react-i18next";

const prepareSSR = (context: NextPageContext) => {
	const order = getOrderParams(context.query.order) ?? "asc";
	const sortBy = getSortingFieldParams(
		context.query.sortBy,
		ArtistSortingKeys,
	);
	const defaultLayout = getLayoutParams(context.query.view) ?? "list";

	return {
		additionalProps: { defaultLayout, sortBy, order },
		infiniteQueries: [
			API.getArtists({}, { sortBy, order }, ["illustration"]),
		],
	};
};

const ArtistsPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({ props }) => {
	const router = useRouter();
	const { t } = useTranslation();

	return (
		<>
			<Head title={t("artists")} />
			<InfiniteArtistView
				initialSortingField={props?.sortBy}
				initialSortingOrder={props?.order}
				defaultLayout={props?.defaultLayout}
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
