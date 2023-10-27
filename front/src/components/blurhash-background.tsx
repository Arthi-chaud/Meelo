import { Box, useTheme } from "@mui/material";
import hexToRgba from "hex-to-rgba";
import Blurhash from "./blurhash";

const BackgroundBlurhash = (props: { blurhash?: string }) => {
	const theme = useTheme();
	const fadeIn = {
		'opacity': 1,
		'animation': `fadeIn 0.${theme.transitions.duration.enteringScreen}ms ${theme.transitions.easing.easeIn} 0ms`,
		"@keyframes fadeIn": { '0%': { opacity: 0 } }
	};

	return <>
		<Blurhash
			blurhash={props.blurhash}
			sx={{
				position: 'fixed', top: 0, left: 0, zIndex: -10000,
				width: '100vw', height: '100vh',
				...fadeIn
			}}
		/>
		<Box sx={{
			position: 'fixed', top: 0, left: 0, zIndex: -10000,
			width: '100vw', height: '100vh',
			background: hexToRgba(theme.palette.background.default, 0.6),
		}}/>
	</>;
};

export default BackgroundBlurhash;
