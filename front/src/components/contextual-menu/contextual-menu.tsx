import { MoreVert } from "@mui/icons-material";
import { Box, IconButton, Menu } from "@mui/material";
import { useState } from "react";
import ContextualMenuItem from "./contextual-menu-item";

type ContextualMenuProps = {
	children: JSX.Element[];
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
    	>
    	    {props.buttonIcon ?? <MoreVert/>}
    	</IconButton>
		<Menu
    		anchorEl={anchorEl}
    		open={open}
    		onClose={handleClose}
      	>
			{props.children.map((child) => <Box onClick={handleClose}>{child}</Box>)}
		</Menu>
	</>
}

export default ContextualMenu;