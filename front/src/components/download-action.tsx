import { Box, Button, Typography } from "@mui/material";
import { NextRouter, useRouter } from "next/router";
import { toast } from "react-hot-toast";

const downloadAction = (router: NextRouter, downloadUrl: string) => {
	toast.error(<Box sx={{ flexDirection: 'column', display :'flex', justifyContent: 'center' }}>
		<Typography sx={{ fontWeight: 'bold', color: 'error' }}>Warning</Typography>
		<Box sx={{ paddingY: 2 }}>
			Downloading copyrighted material you don't own is not authorized. Please proceed if, and only if, you own the original content.
		</Box>
		<Button color='error' variant="outlined" onClick={() => router.push(downloadUrl)}>Download</Button>
	</Box>, { duration: 4000 });
}

export default downloadAction;