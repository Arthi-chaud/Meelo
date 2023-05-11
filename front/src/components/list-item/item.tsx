import {
	Grid, ListItemAvatar, ListItemButton,
	ListItemText, ListItem as MUIListItem,
	Typography, useMediaQuery, useTheme
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
	const viewPortIsSmall = useMediaQuery(theme.breakpoints.down('md'));

	return <MUIListItem disablePadding secondaryAction={props.trailing}>
		<ListItemButton {...{ onClick: props.onClick,
			component: props.href ? Link : undefined, href: props.href }
		}>
			<ListItemAvatar sx={{ marginRight: 2 }}>
				{props.icon}
			</ListItemAvatar>
			{ viewPortIsSmall ?
				<ListItemText
					primary={props.title}
					primaryTypographyProps={primaryTextStyle}
					secondary={props.secondTitle}
					secondaryTypographyProps={secondaryTextStyle}
				/> :
				<Grid container spacing={2} flexWrap='nowrap'>
					<Grid item xs={props.secondTitle ? 8 : 10}>
						<Typography sx={{ ...textStyle, ...primaryTextStyle }}>
							{props.title}
						</Typography>
					</Grid>
					<Grid item xs sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
						<Typography sx={{ ...textStyle, ...secondaryTextStyle }}>
							{props.secondTitle}
						</Typography>
					</Grid>
				</Grid>
			}
		</ListItemButton>
	</MUIListItem>;
};

export default ListItem;
