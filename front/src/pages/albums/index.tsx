import type { NextPageContext } from "next";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import API from "../../api/api";
import { Head } from "../../components/head";
import InfiniteAlbumView from "../../components/infinite/infinite-resource-view/infinite-album-view";
import { AlbumSortingKeys } from "../../models/album";
import type { GetPropsTypesFrom, Page } from "../../ssr";
import { getAlbumTypeParam } from "../../utils/album-type";
import { getLayoutParams } from "../../utils/layout";
import { getOrderParams, getSortingFieldParams } from "../../utils/sorting";

const isCompilationPage = ({ asPath }: { asPath?: string }) =>
	asPath?.includes("/compilations") ?? false;

const prepareSSR = (context: NextPageContext) => {
	const order = getOrderParams(context.query.order) ?? "asc";
	const sortBy = getSortingFieldParams(
		context.query.sortBy,
		AlbumSortingKeys,
	);
	const type = getAlbumTypeParam(context.query.type);
	const defaultLayout = getLayoutParams(context.query.view) ?? "grid";

	return {
		additionalProps: { sortBy, order, defaultLayout, type: type ?? null },
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

const LibraryAlbumsPage: Page<GetPropsTypesFrom<typeof prepareSSR>> = ({
	props,
}) => {
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
				defaultLayout={props?.defaultLayout}
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

LibraryAlbumsPage.prepareSSR = prepareSSR;

export default LibraryAlbumsPage;
