import Artist from "../../models/artist";
import ContextualMenu from "./contextual-menu";
import {
	GoToArtistAction, GoToArtistAlbumsAction, GoToArtistSongsAction
} from "../actions/link";
import { ShareArtistAction } from "../actions/share";
import { UpdateArtistIllustrationAction } from "../actions/update-illustration";
import { useConfirm } from "material-ui-confirm";
import { useQueryClient } from "../../api/use-query";

type ArtistContextualMenuProps = {
	artist: Artist;
}

const ArtistContextualMenu = (props: ArtistContextualMenuProps) => {
	const artistSlug = props.artist.slug;
	const confirm = useConfirm();
	const queryClient = useQueryClient();

	return <ContextualMenu actions={[
		[
			GoToArtistAction(artistSlug),
			GoToArtistAlbumsAction(artistSlug),
			GoToArtistSongsAction(artistSlug),
		],
		[UpdateArtistIllustrationAction(confirm, queryClient, props.artist.id)],
		[ShareArtistAction(artistSlug)]
	]}/>;
};

export default ArtistContextualMenu;
