import { IconButton, Button, Link, ButtonBase, Typography, useTheme } from '@mui/material';
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { Grid } from '@mui/material';
import { useState } from 'react';
import { RequireExactlyOne } from 'type-fest';

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
	whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left'
}

const ListItem = (props: ListItemProps) => {
	let clickableArea = <Button color='secondary' onClick={props.onClick} sx={{ textTransform: 'none', alignItems: 'center', width: '100%' }}>
		<Grid container columns={10} spacing={2} sx={{ alignItems: 'center' }}>
			<Grid item xs={2} sm={1.5} md={1} lg={0.5}>
				{props.icon}
			</Grid>
			<Grid item container xs={8} spacing={2} sx={{ alignItems: 'center'}}>
				<Grid item xs={12} sm={8} sx={textStyle}>
					<Typography fontWeight='bold' sx={textStyle}>{props.title}</Typography>
				</Grid>
				{ props.secondTitle &&
					<Grid item xs={12} sm sx={textStyle}>
						<Typography color="text.disabled" sx={textStyle}>{props.secondTitle}</Typography>
					</Grid>
				}
			</Grid>
		</Grid>
	</Button>;
	if (props.href) {
		clickableArea = <Link href={props.href}>{clickableArea}</Link>;
	}
	return <Grid container padding={1} spacing={2} sx={{ alignItems: 'center', width: 'inherit', display: 'flex', justifyContent: 'space-between' }}>
			<Grid item xs={9} sm={11}>
				{clickableArea}
			</Grid>
			<Grid item xs={3} sm={1} sx={{ display: 'flex', justifyContent: 'center' }}>
				{props.trailing}
			</Grid>
		</Grid>
}

export default ListItem;