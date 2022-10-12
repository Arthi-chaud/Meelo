import { GetServerSidePropsContext, InferGetServerSidePropsType } from "next";
import { useRouter } from "next/router";
import { dehydrate, QueryClient } from "react-query";
import API from "../../../api";
import { Page } from "../../../components/infinite/infinite-scroll";
import InfiniteView from "../../../components/infinite/infinite-view";
import AlbumItem from "../../../components/list-item/album-item";
import ModalPage from "../../../components/modal-page";
import AlbumTile from "../../../components/tile/album-tile";
import Album, { AlbumWithArtist } from "../../../models/album";
import { prepareMeeloInfiniteQuery, prepareMeeloQuery } from "../../../query";
import { SortingParameters } from "../../../utils/sorting";

const artistAlbumsQuery = (artistSlugOrId: number | string) => ({
	key: ["artist", artistSlugOrId, "albums"],
	exec: (lastPage: Page<Album>) => API.getArtistAlbums<AlbumWithArtist>(artistSlugOrId, lastPage, undefined, ["artist"])
});

const artistQuery = (slugOrId: string | number) => ({
	key: ['artist', slugOrId],
	exec: () => API.getArtist(slugOrId),
});

export const getServerSideProps = async (context: GetServerSidePropsContext) => {
	const artistIdentifier = context.params!.slugOrId as string;
	const queryClient = new QueryClient()
  
	await Promise.all([
		await queryClient.prefetchQuery(prepareMeeloQuery(artistQuery, artistIdentifier)),
		await queryClient.prefetchInfiniteQuery(prepareMeeloInfiniteQuery(artistAlbumsQuery, artistIdentifier))
	]);
  
	return {
		props: {
			artistIdentifier,
			dehydratedState: JSON.parse(JSON.stringify(dehydrate(queryClient))),
		},
	}
}

const ArtistAlbumsPage = ({ artistIdentifier }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
	const router = useRouter();
	artistIdentifier ??= router.query.slugOrId as string;
	return <ModalPage>
		<InfiniteView
			enableToggle
			view={'grid'}
			query={() => artistAlbumsQuery(artistIdentifier)}
			renderListItem={(item: AlbumWithArtist) => <AlbumItem album={item} key={item.id} />}
			renderGridItem={(item: AlbumWithArtist) => <AlbumTile album={item} key={item.id} />}
		/>
	</ModalPage>
}
export default ArtistAlbumsPage;