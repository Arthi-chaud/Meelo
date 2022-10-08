import { Box, Typography } from "@mui/material";
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
	return <Box sx={{ flexDirection: 'center' }}>
		<Typography sx={{ fontWeight: 'bold', ...playerTextStyle}}>
			{ props.artist?.name }
		</Typography>
		<Typography sx={{ fontWeight: 'light', ...playerTextStyle}}>
			{ props.track?.name }
		</Typography>
	</Box>
}

export default PlayerText;