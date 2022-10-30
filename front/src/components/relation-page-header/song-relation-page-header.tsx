import { Box } from "@mui/material";
import { useQuery } from "react-query";
import { RequireExactlyOne } from "type-fest";
import API from "../../api";
import { SongWithArtist } from "../../models/song";
import { prepareMeeloQuery } from "../../query";
import SongContextualMenu from "../contextual-menu/song-contextual-menu";
import Illustration from "../illustration";
import { WideLoadingComponent } from "../loading/loading";
import RelationPageHeader from "./relation-page-header";

type SongRelationPageHeaderProps = RequireExactlyOne<{
	songSlugOrId: number | string;
	song: SongWithArtist
}>

const songQuery = (songSlugOrId: number | string) => ({
	key: ["song", songSlugOrId],
	exec: () => API.getSong<SongWithArtist>(songSlugOrId, ["artist"])
});

const SongRelationPageHeader = (props: SongRelationPageHeaderProps) => {
	const song = useQuery(prepareMeeloQuery(songQuery, props.songSlugOrId));
	if (props.song) {
		song.data = props.song;
	}
	if (!song.data) {
		return <WideLoadingComponent/>
	}
	return <RelationPageHeader
		illustration={<Illustration url={song.data.illustration}/>}
		title={song.data.name}
		secondTitle={song.data.artist.name}
		trailing={<SongContextualMenu song={song.data}/>}
	/>
}

export default SongRelationPageHeader;