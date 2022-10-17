import { AccountCircle, Album, Download, Star } from "@mui/icons-material";
import { Divider } from "@mui/material";
import { release } from "os";
import { toast } from "react-hot-toast";
import { useMutation, useQueryClient } from "react-query";
import API from "../../api";
import { AlbumWithArtist } from "../../models/album";
import { ReleaseWithAlbum } from "../../models/release";
import Song, { SongWithArtist } from "../../models/song";
import { TrackWithSong } from "../../models/track";
import ContextualMenu from "./contextual-menu"
import ContextualMenuItem from "./contextual-menu-item";

type TrackContextualMenuProps = {
	track: TrackWithSong;
}

const TrackContextualMenu = (props: TrackContextualMenuProps) => {
	const queryClient = useQueryClient();
	const masterMutation = useMutation(async () => {
		return API.setTrackAsMaster(props.track.id)
			.then(() => {
				toast.success("Track set as master!");
				queryClient.invalidateQueries()
			})
			.catch((e: Error) => toast.error(e.message))
	});
	return <ContextualMenu>
		<ContextualMenuItem icon={<Album/>} href={`/releases/${props.track.releaseId}`} label={"Go to Release"}/>
		<ContextualMenuItem disabled={props.track.master} icon={<Star/>} label={"Set as Master"}
			onClick={() => masterMutation.mutate()}
		/>
		<ContextualMenuItem icon={<Download/>} label={"Download"}
			href={API.getStreamURL(props.track.stream)}
		/>
	</ContextualMenu>
}

export default TrackContextualMenu;