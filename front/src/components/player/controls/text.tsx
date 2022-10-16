import { Box, Button, Typography } from "@mui/material";
import Link from "next/link";
import Artist from "../../../models/artist";
import Song from "../../../models/song";
import Track from "../../../models/track";

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
		<Link href={`/artists/${props.artist.slug}`}>
			<Button sx={{ textTransform: 'none', color: 'inherit'}}>
				<Typography sx={{ ...playerTextStyle}}>
					{ props.artist?.name }
				</Typography>
			</Button>
		</Link>
	</Box>
}

export default PlayerText;