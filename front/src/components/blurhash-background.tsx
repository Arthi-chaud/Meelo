import { Box, useTheme } from "@mui/material";
import hexToRgba from "hex-to-rgba";
import Blurhash from "./blurhash";

const BackgroundBlurhash = (props: { blurhash: string }) => {
	const theme = useTheme();

	return <>
		<Blurhash
			blurhash={props.blurhash}
			sx={{ position: 'fixed', top: 0, left: 0, zIndex: -10000, width: '100%', height: '100%', }}
			style={{ width: '100vw', height: '100vh' }}
		/>
		<Box sx={{
			position: 'fixed', top: 0, left: 0, zIndex: -10000, width: '100%', height: '100%',
			background: hexToRgba(theme.palette.background.default, 0.6),
		}}/>
	</>;
};

export default BackgroundBlurhash;
