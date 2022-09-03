import { useEffect, useState } from "react";
import { Bars } from "react-loader-spinner";
import FadeIn from 'react-fade-in';
import { Box } from '@mui/material';

/**
 * Base loading component
 * @returns 
 */
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

/**
 * Loading component that take the whole width and center the loading animation
 * @returns 
 */
const WideLoadingComponent = () => (
	<Box width='100%' display="flex" justifyContent="center" paddingY={10}>
		<LoadingComponent/>
	</Box>
)

export default LoadingComponent;
export { WideLoadingComponent };