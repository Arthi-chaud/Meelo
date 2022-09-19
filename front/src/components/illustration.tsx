import AspectRatio from "@mui/joy/AspectRatio";
import { Box } from "@mui/material";
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
} & Omit<ImageProps, 'src'>

const Illustration = (props: IllustrationProps) => {
	return <FadeIn>
		<AspectRatio
			ratio="1"
			objectFit="contain"
			componentsProps={{ content: { sx: { display: 'flex', justifyContent: 'center' } } }}
		>
			<Image
				loader={({ src }) => src}
				layout="fill"
				{...props}
				style={{ ...props.style, borderRadius: '3%', width: 'auto' }}
        		src={API.getIllustrationURL(props.url)}
      		/>
		</AspectRatio>
	</FadeIn>
}

export default Illustration;