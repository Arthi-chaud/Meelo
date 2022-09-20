import { IconButton, Collapse } from '@mui/material';
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { Grid } from '@mui/material';
import { useState } from 'react';
import { RequireExactlyOne } from 'type-fest';

type ListItemProps = {
	icon?: JSX.Element;
	title: JSX.Element;
	secondTitle?: JSX.Element;
} & RequireExactlyOne<{
	expanded: () => JSX.Element;
	trailing: JSX.Element;
}>

const ListItem = (props: ListItemProps) => {
	const [expanded, setExpanded] = useState(false);
	return <>
		<Grid container padding={1} spacing={2} columns={10} sx={{ alignItems: 'center' }}>
			<Grid item xs={2} sm={1.5}  md={1} lg={0.5}>
				{props.icon}
			</Grid>
			<Grid item container xs={8} sx={{ alignItems: 'center'}}>
				<Grid item xs={12} sm={9}>
					{props.title}
				</Grid>
				<Grid item xs={12} sm={3} sx={{ display: 'flex', justifyContent: 'left' }}>
					{props.secondTitle ?? ''}
				</Grid>
			</Grid>
			<Grid item container sx={{ justifyContent: 'end' }} xs={1} sm={2} lg={3}>
				{props.expanded !== undefined &&
					<IconButton onClick={() => setExpanded(!expanded) }>
						{expanded ? <ExpandLess /> : <ExpandMore />}
					</IconButton>
				}
				{props.trailing}
			</Grid>
		</Grid>
		<Collapse in={expanded} timeout="auto" unmountOnExit>
			{ props.expanded !== undefined && expanded && props.expanded() }
		</Collapse>
	</>
}

export default ListItem;