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
} & Omit<ImageProps, 'src'>

const Illustration = (props: IllustrationProps) => {
	const theme = useTheme();
	const [loadingFailed, setLoadingFailed] = useState(false);
	return <Box sx={{ aspectRatio: '1', justifyContent: 'center', alignItems: 'center', display: loadingFailed ? 'flex' : 'block' }}>
		{ loadingFailed
			? <IconButton disabled sx={{ fontSize: 'large' }}>
				{props.fallback}
			</IconButton>
			: <Image
				onError={() => setLoadingFailed(true)}
				loader={({ src, width, quality }) => `${src}?width=${width}${quality ? `&quality=${quality}` : ''}`}
				width={1}
				height={1}
				objectFit="contain"
				layout="responsive"
				loading="lazy"
				alt={(props.url?.split('/').join('-') ?? 'missing-illustration')}
				{...props}
				style={{ ...props.style, borderRadius: theme.shape.borderRadius }}
				src={API.getIllustrationURL(props.url ?? '')}
			/>
		}
	</Box>
}

export default Illustration;