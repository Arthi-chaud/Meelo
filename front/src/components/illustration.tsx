import { Box, IconButton, useTheme } from "@mui/material";
import Image, { ImageProps } from "next/image";
import { useEffect, useState } from "react";
import FadeIn from "react-fade-in";
import { useQuery } from "react-query";
import API from "../api";
import LoadingComponent, { WideLoadingComponent } from "./loading/loading";

type IllustrationProps = {
	/**
	 * URL of the illustration to display
	 * Must be an URL from an API response
	 */
	url: string | null;
	/**
	 * An icon to display when illustration rendering failed
	 */
	fallback: JSX.Element;
} & Omit<ImageProps, 'src' | 'alt'>

const Illustration = (props: IllustrationProps) => {
	const theme = useTheme();
	const [loadingFailed, setLoadingFailed] = useState(false);
	const [imageWidth, setImageWidth] = useState(1);
	const [imageHeight, setImageHeight] = useState(1);
	return <Box sx={{ width: '100%', justifyContent: 'center', alignItems: 'center', display: 'flex',  aspectRatio: '1', objectFit: 'contain', overflow: 'hidden' }}>
		{ loadingFailed
			? <IconButton disabled sx={{ fontSize: 'large' }}>
				{props.fallback}
			</IconButton>
			: <Image
				onLoadingComplete={(image) => {
					setImageWidth(image.naturalWidth);
					setImageHeight(image.naturalHeight);
				}}
				onError={() => setLoadingFailed(true)}
				loader={({ src, width, quality }) => src}
				width={imageWidth}
				height={imageHeight}
				unoptimized
				loading="lazy"
				alt={(props.url?.split('/').join('-') ?? 'missing-illustration')}
				{...props}
				style={{ ...props.style, borderRadius: theme.shape.borderRadius, objectFit: 'contain',  width: 'auto', maxWidth: '100%', maxHeight: '100%', }}
				src={API.getIllustrationURL(props.url ?? '')}
			/>
		}
	</Box>
}

export default Illustration;
