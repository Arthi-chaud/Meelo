import type { NextPageContext } from "next";
import { useTranslation } from "react-i18next";
import type { GetPropsTypesFrom, Page } from "ssr";
import { getArtists } from "@/api/queries";
import { ArtistSortingKeys } from "@/models/artist";
import { Head } from "~/components/head";
import { ssrGetSortingParameter } from "~/components/infinite/controls/sort";
import InfiniteArtistView from "~/components/infinite/resource/artist";

const prepareSSR = (context: NextPageContext) => {
	const sort = ssrGetSortingParameter(ArtistSortingKeys, context);

	return {
		infiniteQueries: [getArtists({}, sort, ["illustration"])],
	};
};

const ArtistsPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = () => {
	const { t } = useTranslation();

	return (
		<>
			<Head title={t("models.artist_plural")} />
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
