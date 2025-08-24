/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	Box,
	Divider,
	IconButton,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ContextualMenuIcon } from "@/ui/icons";
import type Action from "~/components/actions";
import { useModal } from "../modal";

export type ContextualMenuProps = {
	actions: Action[][];
	onSelect?: (action: Action) => void;
	buttonIcon?: JSX.Element;
};

export const ContextualMenu = (props: ContextualMenuProps) => {
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
				sx={{ zIndex: "tooltip" }}
			>
				{props.actions
					.filter((actionList) => actionList.length > 0)
					.map((actions, actionGroupIndex, allActions) =>
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
										props.onSelect?.(action);
									}}
								>
									<ContextualMenuItem
										{...action}
										onDialogClose={handleClose}
									/>
								</Box>
							)),
						].concat(
							actionGroupIndex < allActions.length - 1
								? [
										<Divider
											key={actionGroupIndex}
											sx={{ marginY: 0.5 }}
											variant="middle"
										/>,
									]
								: [],
						),
					)}
			</Menu>
		</>
	);
};

export const ContextualMenuItem = (
	props: Action & { onDialogClose: () => void },
) => {
	const { t } = useTranslation();
	const [openModal, closeModal] = useModal();

	const close = () => {
		closeModal();
		props.onDialogClose();
	};
	const onClick = () => {
		if (props.disabled === true) {
			return;
		}
		props.onClick?.();
		if (props.dialog) {
			openModal(() => props.dialog!({ close }));
		}
	};
	const item = (
		<MenuItem
			disabled={props.disabled}
			onClick={onClick}
			sx={{ borderRadius: "0" }}
		>
			{props.icon && <ListItemIcon>{props.icon}</ListItemIcon>}
			<ListItemText>{t(props.label)}</ListItemText>
		</MenuItem>
	);

	if (props.href && !props.disabled) {
		return <Link href={props.href}>{item}</Link>;
	}
	return item;
};
