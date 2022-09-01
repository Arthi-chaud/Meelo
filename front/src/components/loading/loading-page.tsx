import { Box } from '@mui/material';
import LoadingComponent from './loading';
/**
 * Component that take the whole page for a loading animation
 */
const LoadingPage = () => {
	return (
		<Box width='100%' display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
			<LoadingComponent />
		</Box>
	)
}

export default LoadingPage;