import { ListItemIcon, MenuItem,ListItemText } from "@mui/material";
import Link from "next/link";

type MenuItemProps = {
	href?: string;
	disabled?: boolean;
	onClick?: () => void;
	label: string;
	icon?: JSX.Element;
}

const ContextualMenuItem = (props: MenuItemProps) => {
	let item = <MenuItem disabled={props.disabled} onClick={props.onClick} sx={{ borderRadius: '0' }}>
		{ props.icon && <ListItemIcon>{props.icon}</ListItemIcon> }
		<ListItemText>{props.label}</ListItemText>
	</MenuItem>;
	if (props.href) {
		return <Link href={props.href}>{item}</Link>
	}
	return item;
}

export default ContextualMenuItem;