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
} & Omit<ImageProps, 'src' | 'alt'>

const Illustration = (props: IllustrationProps) => {
	const theme = useTheme();
	const [loadingFailed, setLoadingFailed] = useState(false);

	return <Box sx={{
		position: 'relative', aspectRatio: '1', width: '100%',
		justifyContent: 'center', alignItems: 'center',
		display: loadingFailed || !props.url ? 'flex' : 'block'
	}}>{ loadingFailed || !props.url
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
				loader={({ src, width, quality }) => src}
				unoptimized
				fill
				alt={(props.url?.split('/').join('-') ?? 'missing-illustration')}
				{...props}
				style={{ borderRadius: theme.shape.borderRadius, objectFit: "contain", ...props.style }}
				src={API.getIllustrationURL(props.url)}
			/>
		}
	</Box>;
};

export default Illustration;
