import { MoreVert } from "@mui/icons-material";
import { Box, IconButton, Menu } from "@mui/material";
import { useState } from "react";
import ContextualMenuItem from "./contextual-menu-item";

type ContextualMenuProps = {
	children: JSX.Element[];
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
    	>
    	    {props.buttonIcon ?? <MoreVert/>}
    	</IconButton>
		<Menu
    		anchorEl={anchorEl}
    		open={open}
    		onClose={handleClose}
			style={{ zIndex: 99999 }}
      	>
			{props.children.map((child, index) => <Box key={index} onClick={() => {
				handleClose();
				props.onSelect && props.onSelect();
			}}>{child}</Box>)}
		</Menu>
	</>
}

export default ContextualMenu;