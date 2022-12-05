import { PlaylistAdd, PlaylistPlay } from "@mui/icons-material";
import Action from "./action";
import toast from "react-hot-toast";
import { playAfter, playNext } from "../../state/playerSlice";
import store from "../../state/store";

export const PlayNextAction = (
	getTrack: () => PromiseLike<Parameters<typeof playNext>[0]>
): Action => ({
	onClick: () => getTrack().then((track) => {
		store.dispatch(playNext(track));
		toast.success(`'${track.track.name}' will play next!`);
	}),
	label: "Play Next",
	icon: <PlaylistPlay/>
});

export const PlayAfterAction = (
	getTrack: () => PromiseLike<Parameters<typeof playAfter>[0]>
): Action => ({
	onClick: () => getTrack().then((track) => {
		store.dispatch(playAfter(track));
		toast.success(`'${track.track.name}' will play after!`);
	}),
	label: "Play After",
	icon: <PlaylistAdd/>
});
