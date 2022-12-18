/* eslint-disable react/jsx-indent-props */
import {
	Box, IconButton, useTheme
} from "@mui/material";
import Image, { ImageProps } from "next/image";
import { useState } from "react";
import API from "../api/api";
import illustrationFallback from '../../public/icon.png';

type IllustrationProps = {
	/**
	 * URL of the illustration to display
	 * Must be an URL from an API response
	 */
	url: string | null;
	/**
	 * An icon to display when illustration rendering failed
	 */
	fallback?: JSX.Element;

	/**
	 * Aspect Ratio of the Illustration
	 * @default 1
	 */
	aspectRatio?: number;
} & Omit<ImageProps, 'src' | 'alt'>

const Illustration = (props: IllustrationProps) => {
	const theme = useTheme();
	const [loadingFailed, setLoadingFailed] = useState(false);

	return <Box sx={{
		width: '100%', height: '100%',
		position: 'relative', aspectRatio: props.aspectRatio?.toString() ?? '1',
		justifyContent: 'center', alignItems: 'center',
		display: loadingFailed || !props.url ? 'flex' : 'block'
	}}> { loadingFailed || !props.url
			? props.fallback
				? <IconButton disabled sx={{ fontSize: 'large' }}>
					{props.fallback}
				</IconButton>
				: <Image
					src={illustrationFallback}
					fill
					alt='missing-illustration'
					loading='eager'
					style={{ padding: '15%' }}
				/>
			: <Image
				onError={() => setLoadingFailed(true)}
				loader={({ src, width }) => src + `?width=${width}`}
				fill
				sizes="(max-width: 500px) 100vw, (max-width: 1000px) 50vw, 33vw"
				alt={(props.url?.split('/').join('-') ?? 'missing-illustration')}
				{...props}
				style={{ borderRadius: theme.shape.borderRadius, objectFit: "contain", ...props.style }}
				src={API.getIllustrationURL(props.url)}
			/>
		}
	</Box>;
};

export default Illustration;
