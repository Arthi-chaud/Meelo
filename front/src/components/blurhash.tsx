import { Box, createStyles, useTheme } from "@mui/material";
import { blurHashToDataURL } from "../utils/blurhashToDataUrl";
import { isSSR } from "../ssr";
import { Blurhash as RBlurhash } from "react-blurhash";
import Fade from "./fade";

type BlurhashProps = Parameters<typeof Box>['0'] & {
	blurhash?: string
}

const Blurhash = ({ blurhash, ...props }: BlurhashProps) => {
	const theme = useTheme();
	const fadeIn = {
		'opacity': 1,
		'animation': `fadeIn 0.2s ease-in`,
		"@keyframes fadeIn": { '0%': { opacity: 0 } }
	};
	const ssrProps = () => ({
		...props,
		sx: {
			backgroundImage: blurhash ? `url(${blurHashToDataURL(blurhash)})` : 'none',
			backgroundRepeat: 'no-repeat',
			backgroundSize: 'cover',
			...props.sx,
			...fadeIn
		},
	});
	const csrProps = () => ({
		...props,
		sx: {
			borderRadius: theme.shape.borderRadius,
			...props.sx,
			...fadeIn
		},
	} as const);

	return <Box
		{...(isSSR() ? ssrProps() : csrProps())}
		suppressHydrationWarning
	>
		{ isSSR() && blurhash
			? <RBlurhash
				hash={blurhash}
				style={{ width: '100%', height: '100%' }}
			/>
			: <></>
		}
	</Box>;
};

export default Blurhash;
