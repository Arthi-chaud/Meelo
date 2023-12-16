import { ContextualMenuIcon } from "../icons";
import { Box, Divider, IconButton, Menu } from "@mui/material";
import { useState } from "react";
import Action from "../actions/action";
import ContextualMenuItem from "./contextual-menu-item";

type ContextualMenuProps = {
	actions: Action[][];
	onSelect?: (action: Action) => void;
	buttonIcon?: JSX.Element;
};
const ContextualMenu = (props: ContextualMenuProps) => {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};
	const handleClose = () => setAnchorEl(null);

	return (
		<>
			<IconButton
				id="basic-button"
				aria-controls={open ? "basic-menu" : undefined}
				aria-haspopup="true"
				aria-expanded={open ? "true" : undefined}
				onClick={handleClick}
				color="inherit"
			>
				{props.buttonIcon ?? <ContextualMenuIcon />}
			</IconButton>
			<Menu
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				style={{ zIndex: 99999 }}
			>
				{props.actions.map((actions, actionGroupIndex, allActions) =>
					[
						actions.map((action, actionIndex) => (
							<Box
								key={`${actionGroupIndex}/${actionIndex}`}
								onClick={() => {
									// If the action is NOT a dialog, close and unmount the menu.
									// If it is a dialog, we need to keep it mounted, so we have to keep it open
									if (!action.dialog) {
										handleClose();
									}
									props.onSelect && props.onSelect(action);
								}}
							>
								<ContextualMenuItem
									{...action}
									onDialogClose={handleClose}
								/>
							</Box>
						)),
					].concat(
						actionGroupIndex < allActions.length - 1 ?
							[
								<Divider
									key={actionGroupIndex}
									sx={{ marginY: 0.5 }}
									variant="middle"
								/>,
							]
						:	[],
					),
				)}
			</Menu>
		</>
	);
};

export default ContextualMenu;
