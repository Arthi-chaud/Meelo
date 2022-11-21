import { Box, Typography } from "@mui/material";

const NotFoundMessage = () => {
	return <Box>
		<Typography variant="h1">
			Oops
		</Typography>
		<Typography variant="h3">
			The requested resource could not be found
		</Typography>
	</Box>;
};

export default NotFoundMessage;
