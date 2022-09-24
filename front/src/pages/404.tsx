import { Box, Typography, Button } from '@mui/material'
import { NextPage } from 'next'
import Link from 'next/link'

const PageNotFound: NextPage = () => {
	return <Box width='100%' display="flex" justifyContent="space-evenly" alignItems="center" minHeight="100vh" flexDirection="column">
		<Typography variant="h1" sx={{ fontStyle: 'italic', textAlign: 'center' }}>
			Oops... Page not found
		</Typography>
		<Link href="/">
			<Button color='inherit' variant="outlined">Go back home</Button>
		</Link>
	</Box>
}

export default PageNotFound