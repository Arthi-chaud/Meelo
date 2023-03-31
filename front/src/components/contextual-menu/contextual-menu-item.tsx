import {
	ListItemIcon, ListItemText, MenuItem
} from "@mui/material";
import Link from "next/link";
import Action from "../actions/action";

const ContextualMenuItem = (props: Action) => {
	const item = <MenuItem disabled={props.disabled} onClick={props.onClick} sx={{ borderRadius: '0' }}>
		{ props.icon && <ListItemIcon>{props.icon}</ListItemIcon> }
		<ListItemText>{props.label}</ListItemText>
	</MenuItem>;

	if (props.href && !props.disabled) {
		return <Link href={props.href}>{item}</Link>;
	}
	return item;
};

export default ContextualMenuItem;
