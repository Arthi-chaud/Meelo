import {
	Box,
	Grid, ListItemAvatar, ListItemButton,
	ListItemText, ListItem as MUIListItem,
	Typography, useTheme
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

const primaryTextStyle = {
	fontWeight: 'bold'
};

const secondaryTextStyle = {
	color: "text.disabled",
};

const ListItem = (props: ListItemProps) => {
	const theme = useTheme();

	return <MUIListItem disablePadding secondaryAction={props.trailing}>
		<ListItemButton {...{ onClick: props.onClick,
			component: props.href ? Link : undefined, href: props.href }
		}>
			<ListItemAvatar sx={{ marginRight: 2 }}>
				{props.icon}
			</ListItemAvatar>
			<Box sx={{ display: { xs: 'grid', md: 'none' } }}>
				<ListItemText
					primary={props.title}
					primaryTypographyProps={primaryTextStyle}
					secondary={props.secondTitle}
					secondaryTypographyProps={secondaryTextStyle}
				/>
			</Box>
			<Grid container spacing={2} flexWrap='nowrap' sx={{ display: { xs: 'none', md: 'flex' } }}>
				<Grid item xs={props.secondTitle ? 6 : 10}>
					<Typography sx={{ ...textStyle, ...primaryTextStyle }}>
						{props.title}
					</Typography>
				</Grid>
				<Grid item xs={6} sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
					<Typography sx={{ ...textStyle, ...secondaryTextStyle }}>
						{props.secondTitle}
					</Typography>
				</Grid>
			</Grid>
		</ListItemButton>
	</MUIListItem>;
};

export default ListItem;
