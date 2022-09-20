import AspectRatio from "@mui/joy/AspectRatio";
import { Box, IconButton } from "@mui/material";
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
	url: string;
	/**
	 * An icon to display when illustration rendering failed
	 */
	fallback: JSX.Element;
} & Omit<ImageProps, 'src'>

const Illustration = (props: IllustrationProps) => {
	const [loadingFailed, setLoadingFailed] = useState(false);
	return <FadeIn>
		<AspectRatio
			ratio="1"
			objectFit="contain"
			componentsProps={{ content: { sx: { display: 'flex', justifyContent: 'center' } } }}
		>
			{ loadingFailed
				? <IconButton disableFocusRipple disableRipple sx={{ '& svg': {fontSize: 80} }}>
					{props.fallback}
				</IconButton>
				: <Image
					onError={() => setLoadingFailed(true)}
					loader={({ src }) => src}
					layout="fill"
					{...props}
					style={{ ...props.style, borderRadius: '3%', width: 'auto' }}
					src={API.getIllustrationURL(props.url)}
				/>
			}
		</AspectRatio>
	</FadeIn>
}

export default Illustration;