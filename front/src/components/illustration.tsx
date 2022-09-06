import Image from "next/image";
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
} & React.ImgHTMLAttributes<HTMLImageElement>

const Illustration = (props: IllustrationProps) => {
	const [illustrationURLReady, setIllustrationURLReady] = useState(!props.url.startsWith('/songs'))
	const [illustrationURL, setIllustrationURL] = useState(props.url);
	useEffect(() => {
		if (!illustrationURLReady)
			fetch(illustrationURL, { redirect: 'follow' }).then((response) => {
				setIllustrationURLReady(true);
				if (response.redirected) {
					setIllustrationURL(new URL(response.url).pathname);
				}
			});
	}, [illustrationURL]);
	const { isLoading, data } = useQuery(
		illustrationURL,
		() => fetch(API.getIllustrationURL(illustrationURL)).then((response) => response.blob())
	);
	if (illustrationURLReady == false || isLoading)
		return <></>;
	return <FadeIn>
		<img {...props} src={URL.createObjectURL(data!)}/>
	</FadeIn>
}

export default Illustration;