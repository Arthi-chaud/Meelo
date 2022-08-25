import { useEffect, useState } from "react";
import { Bars } from "react-loader-spinner";
import FadeIn from 'react-fade-in';

const LoadingComponent = () => {
	const [displayLoad, setDisplay] = useState(false);
	useEffect(() => {
		const timeId = setTimeout(() => setDisplay(true), 2);
		return () => {
			clearTimeout(timeId)
		}
	}, []);
	return <FadeIn visible={displayLoad}>
		<Bars
			height="40"
			width="40"
			ariaLabel="bars-loading"
		/>
	</FadeIn>
}

export default LoadingComponent;