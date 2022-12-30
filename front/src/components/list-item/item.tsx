import {
	Box, Button, Grid, Typography
} from '@mui/material';
import { RequireExactlyOne } from 'type-fest';
import Link from 'next/link';

type ListItemProps = {
	icon?: JSX.Element;
	title: string;
	secondTitle?: string;
	trailing?: JSX.Element;
} & RequireExactlyOne<{
	href: string;
	onClick: () => void
}>

const textStyle = {
	whiteSpace: 'nowrap', textAlign: 'left'
};

const ListItem = (props: ListItemProps) => {
	let clickableArea = <Button onClick={props.onClick}
		sx={{ textTransform: 'none', alignItems: 'center', width: '100%' }}
	>
		<Grid container columns={10} spacing={2}
			sx={{ alignItems: 'center' }}
		>
			<Grid item xs={1.5} sm={1}
				md={0.75} lg={0.5}
			>
				{props.icon}
			</Grid>
			<Grid item container xs={8.5}
				sm={9} md={9.25} lg={9.5}
				spacing={1} sx={{ alignItems: 'center' }}>
				<Grid item xs={12} sm={9}
					sx={textStyle}
				>
					<Typography fontWeight='bold' sx={textStyle}>
						{props.title}
					</Typography>
				</Grid>
				{ props.secondTitle &&
					<Grid item xs={12} sm={3}
						sx={textStyle}>
						<Typography color="text.disabled" sx={textStyle}>
							{props.secondTitle}
						</Typography>
					</Grid>
				}
			</Grid>
		</Grid>
	</Button>;

	if (props.href) {
		clickableArea = <Link href={props.href} style={{ width: '100%' }}>{clickableArea}</Link>;
	}
	return <Box sx={{ padding: 1, position: 'relative', alignItems: 'center', width: 'inherit', display: 'flex', justifyContent: 'space-between' }}>
		{clickableArea}
		<Box sx={{ position: 'absolute', top: 0, right: 0, display: 'flex', alignItems: 'center', height: '100%', marginX: 3 }}>
			{props.trailing}
		</Box>
	</Box>;
};

export default ListItem;
