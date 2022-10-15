import { ListItemIcon, MenuItem,ListItemText } from "@mui/material";
import Link from "next/link";

type MenuItemProps = {
	href?: string;
	onClick?: () => void;
	label: string;
	icon?: JSX.Element;
}

const ContextualMenuItem = (props: MenuItemProps) => {
	let item = <MenuItem onClick={props.onClick}>
		{ props.icon && <ListItemIcon>{props.icon}</ListItemIcon> }
		<ListItemText>{props.label}</ListItemText>
	</MenuItem>;
	if (props.href) {
		return <Link href={props.href}>{item}</Link>
	}
	return item;
}

export default ContextualMenuItem;