import { Box } from '@mui/material';
import LoadingComponent from './loading';
/**
 * Component that take the whole page for a loading animation
 * It should be at the root of the component tree as its content position's will be `fixed`
 */
const LoadingPage = () => {
	return (
		<Box width='100%' height='100vh' position='fixed'
			display="flex" justifyContent="center" alignItems="center"
		>
			<LoadingComponent />
		</Box>
	);
};

export default LoadingPage;
