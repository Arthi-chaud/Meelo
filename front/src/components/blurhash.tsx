import { Box } from "@mui/material";
import { blurHashToDataURL } from "../utils/blurhashToDataUrl";
import { Blurhash as RBlurhash } from "react-blurhash";
import { useEffect, useMemo, useState } from "react";

type BlurhashProps = Parameters<typeof Box>["0"] & {
	blurhash?: string;
};

const Blurhash = ({ blurhash, ...props }: BlurhashProps) => {
	const [isSSR, setIsSSr] = useState(true);
	const ssrProps = () => ({
		...props,
		sx: {
			backgroundImage:
				blurhash ? `url(${blurHashToDataURL(blurhash)})` : "none",
			backgroundRepeat: "no-repeat",
			backgroundSize: "cover",
			...props.sx,
		},
	});
	const containerProps = useMemo(() => {
		if (isSSR) {
			return ssrProps();
		}
		return props;
	}, [isSSR]);

	useEffect(() => {
		setIsSSr(false);
	}, []);

	return (
		<Box suppressHydrationWarning {...containerProps}>
			{blurhash && (
				<RBlurhash
					hash={blurhash}
					style={{ width: "100%", height: "100%" }}
				/>
			)}
		</Box>
	);
};

export default Blurhash;
