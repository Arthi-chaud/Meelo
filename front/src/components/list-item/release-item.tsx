import { Album, Star } from "@mui/icons-material";
import { ListItemButton, Typography } from "@mui/material";
import Release from "../../models/release"
import Illustration from "../illustration";
import ListItem from "./item";

type ReleaseItemProps = {
	release: Release;
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
		trailing={ release.master ? <Star/> : undefined }
	/>
}
export default ReleaseItem;