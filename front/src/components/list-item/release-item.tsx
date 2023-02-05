import { Star } from "@mui/icons-material";
import { Grid } from "@mui/material";
import { ReleaseWithRelations } from "../../models/release";
import ReleaseContextualMenu from "../contextual-menu/release-contextual-menu";
import Illustration from "../illustration";
import ListItem from "./item";
import getYear from "../../utils/getYear";

type ReleaseItemProps = {
	release: ReleaseWithRelations<['album']>;
}

const ReleaseItem = ({ release }: ReleaseItemProps) => {
	const isMaster = release.id == release.album.masterId;

	return <ListItem key={release.id}
		icon={<Illustration url={release.illustration}/>}
		href={`/releases/${release.id}`}
		title={release.name}
		secondTitle={getYear(release.releaseDate)?.toString()}
		trailing={<Grid container spacing={1} sx={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
			<Grid item sx={{ display: 'flex', alignItems: 'center' }}>
				{isMaster ? <Star/> : undefined }
			</Grid>
			<Grid item>
				{<ReleaseContextualMenu release={release}/>}
			</Grid>
		</Grid>}
	/>;
};

export default ReleaseItem;
