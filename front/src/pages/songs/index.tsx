import type { NextPageContext } from "next";
import { useTranslation } from "react-i18next";
import API from "../../api/api";
import { Head } from "../../components/head";
import InfiniteSongView from "../../components/infinite/infinite-resource-view/infinite-song-view";
import { SongSortingKeys } from "../../models/song";
import type { GetPropsTypesFrom, Page } from "../../ssr";
import { getOrderParams, getSortingFieldParams } from "../../utils/sorting";

const prepareSSR = (context: NextPageContext) => {
	const order = getOrderParams(context.query.order) ?? "asc";
	const sortBy = getSortingFieldParams(context.query.sortBy, SongSortingKeys);

	return {
		additionalProps: { order, sortBy },
		infiniteQueries: [
			API.getSongs({}, { sortBy, order }, [
				"artist",
				"featuring",
				"master",
				"illustration",
			]),
		],
	};
};

const LibrarySongsPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({
	props,
}) => {
	const { t } = useTranslation();

	return (
		<>
			<Head title={t("songs")} />
			<InfiniteSongView
				initialSortingField={props?.sortBy}
				initialSortingOrder={props?.order}
				query={({ sortBy, order, type, library, random }) =>
					API.getSongs(
						{
							type,
							library: library ?? undefined,
							random,
						},
						{ sortBy, order },
						["artist", "featuring", "master", "illustration"],
					)
				}
				groupsQuery={({ sortBy, order, library, type }) =>
					API.getSongGroups(
						{
							type,
							library: library ?? undefined,
						},
						{ sortBy, order },
						["artist", "featuring", "master", "illustration"],
					)
				}
			/>
		</>
	);
};

LibrarySongsPage.prepareSSR = prepareSSR;

export default LibrarySongsPage;
