import { RequireExactlyOne } from "type-fest";
import API from "../../api/api";
import { SongWithRelations } from "../../models/song";
import { useQuery } from "../../api/use-query";
import SongContextualMenu from "../contextual-menu/song-contextual-menu";
import Illustration from "../illustration";
import { WideLoadingComponent } from "../loading/loading";
import RelationPageHeader from "./relation-page-header";
import formatArtists from "../../utils/formatArtists";

type SongRelationPageHeaderProps = RequireExactlyOne<{
	songSlugOrId: number | string;
	song: SongWithRelations<"artist" | "featuring">;
}>;

const SongRelationPageHeader = (props: SongRelationPageHeaderProps) => {
	const song = useQuery(
		(id) => API.getSong(id, ["artist", "featuring"]),
		props.songSlugOrId,
	);

	if (props.song) {
		song.data = props.song;
	}
	if (!song.data) {
		return <WideLoadingComponent />;
	}
	return (
		<RelationPageHeader
			illustration={
				<Illustration
					illustration={song.data.illustration}
					quality="med"
				/>
			}
			title={song.data.name}
			secondTitle={formatArtists(song.data.artist, song.data.featuring)}
			trailing={<SongContextualMenu song={song.data} />}
		/>
	);
};

export default SongRelationPageHeader;
