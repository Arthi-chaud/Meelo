import { Box } from "@mui/material";
import { useEffect, useState } from "react";
import { blurHashToDataURL } from "../utils/blurhashToDataUrl";
import { isSSR } from "../ssr";

type BlurhashProps = Parameters<typeof Box>['0'] & {
	blurhash: string
}

const Blurhash = ({ blurhash, ...props }: BlurhashProps) => {
	const [base64, setBase64] = useState<string | undefined>(
		isSSR() ? blurHashToDataURL(blurhash) : undefined
	);

	useEffect(() => {
		if (!blurhash) {
			return;
		}
		const toBase64 = async () => {
			return blurHashToDataURL(blurhash);
		};

		toBase64().then((b64) => {
			if (b64) {
				setBase64(b64);
			}
		});
	}, [blurhash]);
	return <Box {...props} sx={{
		backgroundImage: base64 ? `url(${base64})` : 'none',
		backgroundRepeat: 'no-repeat',
		backgroundSize: 'cover',
		transition: 'background 3s',
		...props.sx
	}}/>;
};

export default Blurhash;
