import { useEffect, useState } from "react";
import { Bars } from "react-loader-spinner";

const LoadingComponent = () => {
	const [displayLoad, setDisplay] = useState(false);
	useEffect(() => {
		const timeId = setTimeout(() => setDisplay(true), 3000);
		return () => {
			clearTimeout(timeId)
		}
	}, []);
	return <Bars
		height="80"
		width="80"
		color="#4fa94d"
		ariaLabel="bars-loading"
		wrapperStyle={{}}
		wrapperClass=""
		visible={displayLoad}
	/>
}

export default LoadingComponent;