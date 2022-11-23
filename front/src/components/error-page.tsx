import {
	Box, Button, Typography
} from "@mui/material";
import Link from "next/link";

type ErrorPageProps = {
	heading: string;
}

/**
 * Common skeleton for error pages (404, 500)
 */
const ErrorPage = ({ heading }: ErrorPageProps) => {
	return <Box
		width='100%' display="flex" justifyContent="space-evenly"
		alignItems="center" minHeight="100vh" flexDirection="column"
	>
		<Typography variant="h1" sx={{
			overflow: 'visible', width: '90%',
			fontStyle: 'italic', textAlign: 'center'
		}}>
			{heading}
		</Typography>
		<Link href="/">
			<Button color='inherit' variant="outlined">Go back home</Button>
		</Link>
	</Box>;
};

export default ErrorPage;
