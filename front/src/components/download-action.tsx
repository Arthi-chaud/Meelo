import { Close } from "@mui/icons-material";
import { Box, Button, Grid, IconButton, Typography } from "@mui/material";
import { NextRouter, useRouter } from "next/router";
import { toast } from "react-hot-toast";

const downloadAction = (router: NextRouter, downloadUrl: string) => {
	let toastId: string | undefined = undefined;
	const getToastId = () => toastId;
	toastId = toast.error(<Box sx={{ flexDirection: 'column', display :'flex', justifyContent: 'center' }}>
		<Grid container sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
			<Grid item>
				<Typography sx={{ fontWeight: 'bold', color: 'error' }}>Warning</Typography>
			</Grid>
			<Grid item>
				<IconButton  color='inherit' onClick={() => toast.dismiss(getToastId())}><Close/></IconButton>
			</Grid>
		</Grid>
		<Box sx={{ paddingY: 2 }}>
			Downloading copyrighted material you don't own is not authorized. Please proceed if, and only if, you own the original content.
		</Box>
		<Button color='error' variant="outlined" onClick={() => {
			router.push(downloadUrl);
			toast.dismiss(getToastId());
		}}>Download</Button>
	</Box>, { duration: 4000 });
}

export default downloadAction;