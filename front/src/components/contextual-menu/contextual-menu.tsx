import { MoreVert } from "@mui/icons-material";
import {
	Box, Divider, IconButton, Menu
} from "@mui/material";
import { useState } from "react";
import Action from "../actions/action";
import ContextualMenuItem from "./contextual-menu-item";

type ContextualMenuProps = {
	actions: Action[][];
	onSelect?: () => void;
	buttonIcon?: JSX.Element;
}
const ContextualMenu = (props: ContextualMenuProps) => {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};
	const handleClose = () => setAnchorEl(null);

	return <>
		<IconButton
			id="basic-button"
			aria-controls={open ? 'basic-menu' : undefined}
			aria-haspopup="true"
			aria-expanded={open ? 'true' : undefined}
			onClick={handleClick}
			color='inherit'
		>
			{props.buttonIcon ?? <MoreVert/>}
		</IconButton>
		<Menu
			anchorEl={anchorEl}
			open={open}
			onClose={handleClose}
			style={{ zIndex: 99999 }}
		>
			{props.actions.map((actions, actionGroupIndex, allActions) => [
				actions.map((action, actionIndex) => <Box key={`${actionGroupIndex}/${actionIndex}`} onClick={() => {
					handleClose();
					props.onSelect && props.onSelect();
				}}><ContextualMenuItem {...action}/></Box>)
			].concat(actionGroupIndex < allActions.length - 1
				? [<Divider key={actionGroupIndex} sx={{ marginY: 0.5 }} variant='middle'/>]
				: []))
			}
		</Menu>
	</>;
};

export default ContextualMenu;
