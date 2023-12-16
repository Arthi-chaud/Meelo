import API from "../../api/api";
import { SongWithRelations } from "../../models/song";
import Illustration from "../illustration";
import ListItem from "./item";
import { useDispatch } from "react-redux";
import { playTrack } from "../../state/playerSlice";
import SongContextualMenu from "../contextual-menu/song-contextual-menu";
import { useQueryClient } from "../../api/use-query";
import { useEffect, useState } from "react";
import { SongIcon } from "../icons";
import formatArtists from "../../utils/formatArtists";

type SongItemProps = {
	song: SongWithRelations<"artist" | "featuring">;
	formatSubtitle?: (song: SongWithRelations<"artist">) => Promise<string>;
};

/**
 * Item for a list of songs
 * @param props
 * @returns
 */
const SongItem = ({ song, formatSubtitle }: SongItemProps) => {
	const artist = song.artist;
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const [subtitle, setSubtitle] = useState(
		formatSubtitle ? "" : formatArtists(song.artist, song.featuring),
	);

	useEffect(() => {
		if (formatSubtitle) {
			formatSubtitle(song).then((newSub) => setSubtitle(newSub));
		}
	}, []);
	return (
		<ListItem
			icon={
				<Illustration
					illustration={song.illustration}
					fallback={<SongIcon />}
					quality="low"
				/>
			}
			title={song.name}
			onClick={() =>
				queryClient
					.fetchQuery(API.getMasterTrack(song.id, ["release"]))
					.then((track) => {
						dispatch(
							playTrack({
								artist,
								track,
								release: track.release,
							}),
						);
					})
			}
			secondTitle={subtitle}
			trailing={<SongContextualMenu song={song} />}
		/>
	);
};

export default SongItem;
