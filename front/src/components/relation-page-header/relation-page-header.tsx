import { Divider, Grid, Typography } from "@mui/material";

type RelationHeaderProps = {
	illustration: JSX.Element;
	title: string;
	secondTitle?: string;
	trailing: JSX.Element
}
const RelationPageHeader = (props: RelationHeaderProps) => {
	return <>
		<Grid container sx={{ width: 'inherit', height: 'auto' }}>
			<Grid item xs={4} sm={3} md={2} xl={1} sx={{ padding: 3 }}>
				{props.illustration}
			</Grid>
			<Grid item container direction='column' xs sx={{ justifyContent: 'space-evenly' }}>
				<Grid item>
					<Typography variant='h5' sx={{ fontWeight: 'bold' }}>
						{props.title}
					</Typography>
				</Grid>
				{ props.secondTitle &&
					<Grid item>
						<Typography>
							{props.secondTitle}
						</Typography>
					</Grid>
				}
			</Grid>
			<Grid item xs={1} sx={{ alignItems: 'center', display: 'flex' }}>
				{props.trailing}
			</Grid>
		</Grid>
		<Divider variant="middle"/>
	</>
}

export default RelationPageHeader;