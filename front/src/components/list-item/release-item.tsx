import { Album, Star } from "@mui/icons-material";
import { Grid, ListItemButton, Typography } from "@mui/material";
import Release, { ReleaseWithAlbum } from "../../models/release"
import ReleaseContextualMenu from "../contextual-menu/release-contextual-menu";
import Illustration from "../illustration";
import ListItem from "./item";

type ReleaseItemProps = {
	release: ReleaseWithAlbum;
}

const ReleaseItem = ({ release }: ReleaseItemProps) => {
	return <ListItem key={release.id}
		icon={<Illustration url={release.illustration} fallback={<Album/>}/>}
		href={`/releases/${release.id}`}
		title={release.name}
		secondTitle={release.releaseDate
			? new Date(release.releaseDate).getFullYear().toString()
			: undefined
		}
		trailing={ <Grid container spacing={1} sx={{ justifyContent: 'flex-end' }}>
			<Grid item sx={{ display: 'flex', alignItems: 'center' }}>{release.master ? <Star/> : undefined }</Grid>
			<Grid item>{<ReleaseContextualMenu release={release}/>}</Grid>
		</Grid> }
	/>
}
export default ReleaseItem;