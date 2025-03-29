import type { NextPageContext } from "next";
import { useTranslation } from "react-i18next";
import type { GetPropsTypesFrom, Page } from "ssr";
import API from "~/api/api";
import { Head } from "~/components/head";
import {
	getOrderQuery,
	getSortQuery,
} from "~/components/infinite/controls/sort";
import { HybridInfiniteSongView } from "~/components/infinite/resource/song";
import { SongSortingKeys } from "~/models/song";

const prepareSSR = (context: NextPageContext) => {
	const order = getOrderQuery(context) ?? "asc";
	const sortBy = getSortQuery(context, SongSortingKeys);

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

const SongsPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = () => {
	const { t } = useTranslation();

	return (
		<>
			<Head title={t("songs")} />
			<HybridInfiniteSongView
				song={{
					query: ({ sortBy, order, types, libraries, random }) =>
						API.getSongs(
							{
								type: types,
								library: libraries,
								random,
							},
							{ sortBy, order },
							["artist", "featuring", "master", "illustration"],
						),
				}}
				songGroup={{
					query: ({ libraries, type }) =>
						API.getSongGroups(
							{
								type: type,
								library: libraries,
							},
							{ sortBy: "name", order: "asc" },
							["artist", "featuring", "master", "illustration"],
						),
				}}
			/>
		</>
	);
};

SongsPage.prepareSSR = prepareSSR;

export default SongsPage;
