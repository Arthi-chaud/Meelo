import {
	Box, Button, Typography
} from "@mui/material";
import Link from "next/link";
import Translate from "../i18n/translate";
import { useErrorBoundary } from "react-error-boundary";

type ErrorPageProps = {
	heading: string | JSX.Element;
}

/**
 * Common skeleton for error pages (404, 500)
 */
const ErrorPage = ({ heading }: ErrorPageProps) => {
	const { resetBoundary } = useErrorBoundary();

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
		<Link href="/" onClick={() => resetBoundary()}>
			<Button color='inherit' variant="outlined">
				<Translate translationKey="goBackHome"/>
			</Button>
		</Link>
	</Box>;
};

export default ErrorPage;
