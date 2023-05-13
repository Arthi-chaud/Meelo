import { Grid, Typography } from "@mui/material";

type SectionHeaderProps<T> = {
	heading: string | JSX.Element;
	trailing?: JSX.Element;
}

/**
 * A scrollable row (possibly of tiles) with a header with a 'more' button
 */
const SectionHeader = <T, >(props: SectionHeaderProps<T>) => {
	return <Grid item sx={{
		display: 'flex', flexGrow: 1,
		justifyContent: 'space-between', alignItems: 'center'
	}}>
		<Typography variant='h5' fontWeight='bold'>{props.heading}</Typography>
		{props.trailing}
	</Grid>;
};

export default SectionHeader;
