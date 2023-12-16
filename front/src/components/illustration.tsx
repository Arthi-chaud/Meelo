/* eslint-disable react/jsx-indent-props */
import {
	Box, IconButton, useTheme
} from "@mui/material";
import Image, { ImageProps } from "next/image";
import { useState } from "react";
import API from "../api/api";
import whiteIllustrationFallback from '../../public/icon.png';
import blackIllustrationFallback from '../../public/icon-black.png';
import { RequireExactlyOne } from "type-fest";
import IllustrationModel from "../models/illustration";
import Blurhash from "./blurhash";
import { isSSR } from "../ssr";
import Fade from "./fade";
import useColorScheme from "../theme/color-scheme";

type ImageQuality = 'low' | 'med' | 'original';

const getImageWidth = (quality: ImageQuality) => {
	switch (quality) {
	case 'low':
		return 100;
	case 'med':
		return 350;
	case 'original':
		return undefined;
	}
};

type IllustrationProps = {
	/**
	 * An icon to display when illustration rendering failed
	 */
	fallback?: JSX.Element;

	/**
	 * Aspect Ratio of the Illustration
	 * @default 1
	 */
	aspectRatio?: number;

	/**
	 * Quality preset, in which to dl the image.
	 */
	quality: ImageQuality;

	imgProps?: ImageProps['style']
} & RequireExactlyOne<{
	/**
	 * URL of the illustration to display
	 * Must be an URL from an API response
	 */
	url: string | null;

	illustration: IllustrationModel | null;
}>

const Illustration = (props: IllustrationProps) => {
	const theme = useTheme();
	const [loadingFailed, setLoadingFailed] = useState(false);
	const [loadingCompleted, setLoadingCompleted] = useState(false);
	const url = props.url ?? props.illustration?.url;
	const blurhash = props.illustration?.blurhash;
	const colorScheme = useColorScheme();

	return <Box key={'illustration-' + url} sx={{
		width: '100%', height: '100%',
		position: 'relative', aspectRatio: props.aspectRatio?.toString() ?? '1',
		justifyContent: 'center', alignItems: 'center',
		display: loadingFailed || !url ? 'flex' : 'block',
	}}>
		{blurhash &&
			<Fade in={!loadingCompleted && !loadingFailed} unmountOnExit>
				<Box style={{ width: 'inherit', height: 'inherit',
					borderRadius: theme.shape.borderRadius, overflow: 'hidden', ...props.imgProps }}>
					<Blurhash
						blurhash={blurhash}
						style={{ width: 'inherit', height: 'inherit' }}
					/>
				</Box>
			</Fade>
		}
		<Fade in={isSSR() || loadingCompleted || loadingFailed || !url}>
			<Box>{loadingFailed || !url
				? props.fallback
					? <IconButton disabled sx={{ fontSize: 'large' }} component='div'>
						{props.fallback}
					</IconButton>
					: <Image
						src={colorScheme == 'dark'
							? whiteIllustrationFallback
							: blackIllustrationFallback
						}
						fill
						alt='missing-illustration'
						loading='eager'
						style={{ padding: '15%' }}
					/>
				: <Image
					onError={() => setLoadingFailed(true)}
					onLoadingComplete={() => setLoadingCompleted(true)}
					fill
					alt={(url?.split('/').join('-') ?? 'missing-illustration')}
					unoptimized
					style={{
						borderRadius: theme.shape.borderRadius,
						objectFit: "contain",
						...props.imgProps,
					}}
					src={API.getIllustrationURL(url) + (props.quality == 'original'
						? ''
						: `?width=${getImageWidth(props.quality)}`)}
				/>}
			</Box>
		</Fade>
	</Box>;
};

export default Illustration;
