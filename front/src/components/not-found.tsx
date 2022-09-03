import { Typography } from "@mui/material"

const NotFoundMessage = () => {
	return <div>
		<Typography variant="h1">
		  Oops
		</Typography>
		<Typography variant="h3">
		  The requested resource could not be found
		</Typography>
	</div>
}

export default NotFoundMessage