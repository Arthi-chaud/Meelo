import Tile from "./tile";
import Illustration from "../illustration";
import Release from "../../models/release";
import getYear from "../../utils/getYear";

const ReleaseTile = <T extends Release>(props: {
	release: T,
	formatSubtitle?: (release: T) => string
}) => {
	return <Tile
		title={props.release.name}
		subtitle={props.formatSubtitle?.call(this, props.release)
			?? getYear(props.release.releaseDate)?.toString()}
		href={`/releases/${props.release.id}`}
		illustration={<Illustration url={props.release.illustration}/>}
	/>;
};

export default ReleaseTile;
