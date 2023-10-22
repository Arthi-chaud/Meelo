/* eslint-disable react/jsx-indent-props */
import {
	Box, IconButton, useTheme
} from "@mui/material";
import Image, { ImageProps } from "next/image";
import { useState } from "react";
import API from "../api/api";
import illustrationFallback from '../../public/icon.png';
import { RequireExactlyOne } from "type-fest";
import IllustrationModel from "../models/illustration";
import { Blurhash } from "react-blurhash";
import { isSSR } from "../ssr";
import Fade from "./fade";
import { blurHashToDataURL } from "../utils/blurhashToDataUrl";

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
} & Omit<ImageProps, 'src' | 'alt'> & RequireExactlyOne<{
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
	const blurhash = props.illustration?.blurhash ?? null;

	return <Box key={'illustration-' + url} sx={{
		width: '100%', height: '100%',
		position: 'relative', aspectRatio: props.aspectRatio?.toString() ?? '1',
		justifyContent: 'center', alignItems: 'center',
		display: loadingFailed || !url ? 'flex' : 'block'
	}}>
		{blurhash &&
			<Fade in={!loadingCompleted && !loadingFailed} unmountOnExit mountOnEnter>
				<Box style={{ width: 'inherit', height: 'inherit',
					borderRadius: theme.shape.borderRadius, overflow: 'hidden', ...props.style }}>
					<Blurhash
						hash={blurhash}
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
						src={illustrationFallback}
						fill
						alt='missing-illustration'
						loading='eager'
						style={{ padding: '15%' }}
					/>
				: <Image
					onError={() => setLoadingFailed(true)}
					onLoadingComplete={() => setLoadingCompleted(true)}
					loader={({ src, width }) => src + `?width=${width}`}
					fill
					sizes="(max-width: 500px) 100vw, (max-width: 1000px) 50vw, 25vw"
					alt={(url?.split('/').join('-') ?? 'missing-illustration')}
					{...(blurhash && isSSR()
						? {
							blurDataURL: blurHashToDataURL(blurhash),
							placeholder: 'blur'
						}
						: {})
					}
					{...props}
					style={{
						borderRadius: theme.shape.borderRadius,
						objectFit: "contain",
						...props.style,
					}}
					src={API.getIllustrationURL(url)}
				/>}
			</Box>
		</Fade>
	</Box>;
};

export default Illustration;
