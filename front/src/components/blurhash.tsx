import {
	Box, NoSsr, useTheme
} from "@mui/material";
import { blurHashToDataURL } from "../utils/blurhashToDataUrl";
import { isSSR } from "../ssr";
import { Blurhash as RBlurhash } from "react-blurhash";

type BlurhashProps = Parameters<typeof Box>['0'] & {
	blurhash?: string
}

const Blurhash = ({ blurhash, ...props }: BlurhashProps) => {
	const theme = useTheme();

	const ssrProps = () => ({
		...props,
		sx: {
			backgroundImage: blurhash ? `url(${blurHashToDataURL(blurhash)})` : 'none',
			backgroundRepeat: 'no-repeat',
			backgroundSize: 'cover',
			...props.sx,
		},
	});
	const csrProps = () => ({
		...props,
		sx: {
			borderRadius: theme.shape.borderRadius,
			...props.sx,
		},
	} as const);

	return <Box
		suppressHydrationWarning
		{...(isSSR() ? ssrProps() : csrProps())}
	>
		<NoSsr>
			{ blurhash && <RBlurhash
				hash={blurhash}
				style={{ width: '100%', height: '100%' }}
			/> }
		</NoSsr>
	</Box>;
};

export default Blurhash;
