import { AccountCircle, Album, Download, PlaylistAdd, PlaylistPlay, Star } from "@mui/icons-material";
import { Divider } from "@mui/material";
import { useRouter } from "next/router";
import { release } from "os";
import { toast } from "react-hot-toast";
import { useMutation, useQueryClient } from "react-query";
import { useDispatch } from "react-redux";
import API from "../../api";
import { AlbumWithArtist } from "../../models/album";
import { ReleaseWithAlbum } from "../../models/release";
import Song, { SongWithArtist } from "../../models/song";
import { TrackWithSong } from "../../models/track";
import { playNext, playAfter } from "../../state/playerSlice";
import downloadAction from "../download-action";
import ContextualMenu from "./contextual-menu"
import ContextualMenuItem from "./contextual-menu-item";

type TrackContextualMenuProps = {
	track: TrackWithSong;
	onSelect?: () => void;
}

const TrackContextualMenu = (props: TrackContextualMenuProps) => {
	const router = useRouter();
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const masterMutation = useMutation(async () => {
		return API.setTrackAsMaster(props.track.id)
			.then(() => {
				toast.success("Track set as master!");
				queryClient.invalidateQueries()
			})
			.catch((e: Error) => toast.error(e.message))
	});
	return <ContextualMenu onSelect={props.onSelect}>
		<ContextualMenuItem icon={<Album/>} href={`/releases/${props.track.releaseId}`} label={"Go to Release"}/>
		<Divider/>
		<ContextualMenuItem icon={<PlaylistPlay/>} label={"Play Next"}
			onClick={() => API.getRelease(props.track.releaseId)
				.then((release) => API.getArtist(props.track.song.artistId).then((artist) => {
					dispatch(playNext({ track: props.track, artist, release }))
				}))
			}
		/>
		<ContextualMenuItem icon={<PlaylistAdd/>} label={"Play After"}
			onClick={() => API.getRelease(props.track.releaseId)
				.then((release) => API.getArtist(props.track.song.artistId).then((artist) => {
					dispatch(playAfter({ track: props.track, artist, release }))
				}))
			}
		/>
		<Divider/>
		<ContextualMenuItem disabled={props.track.master} icon={<Star/>} label={"Set as Master"}
			onClick={() => masterMutation.mutate()}
		/>
		<Divider/>
		<ContextualMenuItem icon={<Download/>} label={"Download"} onClick={() => downloadAction(router, API.getStreamURL(props.track.stream))}/>
	</ContextualMenu>
}

export default TrackContextualMenu;