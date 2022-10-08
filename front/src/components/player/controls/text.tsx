import { Box, Button, Typography } from "@mui/material";
import Link from "next/link";
import Artist from "../../../models/artist";
import Song from "../../../models/song";
import Track from "../../../models/track";
import ListItemButton from "../../list-item/item-button";

type PlayerTextProps = {
	artist?: Artist;
	track?: Track;
}

const playerTextStyle = {
	whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center'
}


const PlayerText = (props: PlayerTextProps) => {
	if (!props.track || !props.artist)
		return <Box/>
	return <Box sx={{ display: 'grid', justifyContent: 'center', flexDirection: 'column', ...playerTextStyle }}>
		<Link href={`/releases/${props.track.releaseId}`}>
			<Button sx={{ textTransform: 'none', color: 'inherit' }}>
				<Typography sx={{ fontWeight: 'bold', ...playerTextStyle}}>
					{ props.track?.name }
				</Typography>
			</Button>
		</Link>
		<Box>
			<ListItemButton
				url={`/artists/${props.artist.slug}`}
				label={props.artist.name}
			/>
		</Box>
	</Box>
}

export default PlayerText;