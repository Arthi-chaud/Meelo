import { Grid, Typography } from "@mui/material";

type RelationHeaderProps = {
	illustration: JSX.Element;
	title: string;
	secondTitle?: string;
	trailing: JSX.Element
}
const RelationPageHeader = (props: RelationHeaderProps) => {
	return <>
		<Grid container spacing={4} flexWrap={'nowrap'} sx={{ width: 'inherit', height: 'auto' }}>
			<Grid item xs={4} sm={3}
				md={2} xl={1} sx={{ margin: 2 }}>
				{props.illustration}
			</Grid>
			<Grid item container direction='column'
				xs sx={{ justifyContent: 'space-evenly' }}>
				<Grid item>
					<Typography variant='h3' sx={{ fontWeight: 'bold' }}>
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
			<Grid item xs={2} sm={1}
				sx={{ alignItems: 'center', display: 'flex' }}>
				{props.trailing}
			</Grid>
		</Grid>
	</>;
};

export default RelationPageHeader;
