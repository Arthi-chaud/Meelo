import {
	Dialog,
	ListItemIcon, ListItemText, MenuItem
} from "@mui/material";
import Link from "next/link";
import Action from "../actions/action";
import { useState } from "react";

const ContextualMenuItem = (props: Action) => {
	const [modalOpen, setModalOpen] = useState(false);
	const onClick = () => {
		if (props.disabled === true) {
			return;
		}
		props.onClick && props.onClick();
		if (props.dialog) {
			setModalOpen(true);
		}
	};
	const closeModal = () => setModalOpen(false);
	const item = <MenuItem disabled={props.disabled} onClick={onClick} sx={{ borderRadius: '0' }}>
		{ props.icon && <ListItemIcon>{props.icon}</ListItemIcon> }
		<ListItemText>{props.label}</ListItemText>
	</MenuItem>;

	if (props.href && !props.disabled) {
		return <Link href={props.href}>{item}</Link>;
	}
	return <>
		{item}
		{props.dialog && <Dialog open={modalOpen} onClose={closeModal} fullWidth>
			{props.dialog({ close: closeModal })}
		</Dialog>}
	</>;
};

export default ContextualMenuItem;
