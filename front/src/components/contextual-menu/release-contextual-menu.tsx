import { AccountCircle, Album, Star } from "@mui/icons-material";
import { Divider } from "@mui/material";
import { release } from "os";
import { toast } from "react-hot-toast";
import { useMutation, useQueryClient } from "react-query";
import API from "../../api";
import { AlbumWithArtist } from "../../models/album";
import { ReleaseWithAlbum } from "../../models/release";
import Song, { SongWithArtist } from "../../models/song";
import ContextualMenu from "./contextual-menu"
import ContextualMenuItem from "./contextual-menu-item";
type ReleaseContextualMenuProps = {
	release: ReleaseWithAlbum;
}

const ReleaseContextualMenu = (props: ReleaseContextualMenuProps) => {
	const queryClient = useQueryClient();
	const masterMutation = useMutation(async () => {
		return API.setReleaseAsMaster(props.release.id)
			.then(() => {
				toast.success("Release set as master!");
				queryClient.invalidateQueries()
			})
			.catch((e: Error) => toast.error(e.message))
	});
	const tracksMasterMutation = useMutation(async () => {
		return API.getReleasePlaylist(props.release.id)
			.then((tracks) => {
				Promise.allSettled(
					tracks.reverse().map((track) =>	API.setTrackAsMaster(track.id))
				).then(() => {
					toast.success("Tracks successfully updated");
					queryClient.invalidateQueries();
				})
				.catch((e) => toast.error(e.message))
			})
			
	});
	return <ContextualMenu>
		{ props.release.album.artistId ?
			<ContextualMenuItem icon={<AccountCircle/>} href={`/artists/${props.release.album.artistId}`} label={"Go to Artist"}/>
			: <></>
		}
		<ContextualMenuItem icon={<Album/>} href={`/albums/${props.release.album.id}`} label={"Go to Album"}/>
		<ContextualMenuItem disabled={props.release.master} icon={<Star/>} label={"Set as Master"}
			onClick={() => masterMutation.mutate()}
		/>
		<ContextualMenuItem icon={<Star/>} label={"Set all tracks as Master"}
			onClick={() => tracksMasterMutation.mutate()}
		/>
	</ContextualMenu>
}

export default ReleaseContextualMenu;