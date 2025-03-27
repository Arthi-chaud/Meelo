import type { NextPageContext } from "next";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import API from "../../api/api";
import { Head } from "../../components/head";
import {
	getOrderQuery,
	getSortQuery,
} from "../../components/infinite/controls/sort";
import InfiniteAlbumView from "../../components/infinite/infinite-resource-view/infinite-album-view";
import { AlbumSortingKeys } from "../../models/album";
import type { GetPropsTypesFrom, Page } from "../../ssr";
import { getAlbumTypeParam } from "../../utils/album-type";

const isCompilationPage = ({ asPath }: { asPath?: string }) =>
	asPath?.includes("/compilations") ?? false;

const prepareSSR = (context: NextPageContext) => {
	const order = getOrderQuery(context) ?? "asc";
	const sortBy = getSortQuery(context, AlbumSortingKeys);
	const type = getAlbumTypeParam(context.query.type);

	return {
		additionalProps: { sortBy, order, type: type ?? null },
		infiniteQueries: [
			API.getAlbums(
				{
					type: type ?? undefined,
					artist: isCompilationPage(context)
						? "compilations"
						: undefined,
				},
				{ sortBy, order },
				["artist", "illustration"],
			),
		],
	};
};

const AlbumsPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({ props }) => {
	const defaultType = props?.type ?? null;
	const { t } = useTranslation();
	const router = useRouter();

	return (
		<>
			<Head title={t("albums")} />
			<InfiniteAlbumView
				defaultAlbumType={defaultType}
				initialSortingField={props?.sortBy}
				initialSortingOrder={props?.order}
				query={({ sortBy, order, type, library }) =>
					API.getAlbums(
						{
							type,
							library: library ?? undefined,
							artist: isCompilationPage(router)
								? "compilations"
								: undefined,
						},
						{ sortBy, order },
						["artist", "illustration"],
					)
				}
			/>
		</>
	);
};

AlbumsPage.prepareSSR = prepareSSR;

export default AlbumsPage;
