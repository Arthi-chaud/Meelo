import Tile from "./tile";
import Illustration from "../illustration";
import { ReleaseWithRelations } from "../../models/release";
import getYear from "../../utils/getYear";
import ReleaseContextualMenu from "../contextual-menu/release-contextual-menu";

const ReleaseTile = (props: {
	release: ReleaseWithRelations<'album'>,
	formatSubtitle?: (release: ReleaseWithRelations<'album'>) => string
}) => {
	return <Tile
		contextualMenu={<ReleaseContextualMenu release={props.release}/>}
		title={props.release.name}
		subtitle={props.formatSubtitle?.call(this, props.release)
			?? getYear(props.release.releaseDate)?.toString()}
		href={`/releases/${props.release.id}`}
		illustration={<Illustration illustration={props.release.illustration}/>}
	/>;
};

export default ReleaseTile;
