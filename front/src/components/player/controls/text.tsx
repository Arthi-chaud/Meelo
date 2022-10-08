import { Box, Typography } from "@mui/material";

type PlayerTextProps = {
	artist?: string;
	title?: string;
}

const playerTextStyle = {
	whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center'
}


const PlayerText = (props: PlayerTextProps) => {
	return <Box sx={{ flexDirection: 'center' }}>
		<Typography sx={{ fontWeight: 'bold', ...playerTextStyle}}>
			{ props.title }
		</Typography>
		<Typography sx={{ fontWeight: 'light', ...playerTextStyle}}>
			{ props.artist }
		</Typography>
	</Box>
}

export default PlayerText;