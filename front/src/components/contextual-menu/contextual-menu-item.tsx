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

import { Dialog, ListItemIcon, ListItemText, MenuItem } from "@mui/material";
import Link from "next/link";
import Action from "../actions/action";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const ContextualMenuItem = (props: Action & { onDialogClose: () => void }) => {
	const { t } = useTranslation();
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
	const closeModal = () => {
		setModalOpen(false);
		props.onDialogClose();
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
	return (
		<>
			{item}
			{props.dialog && (
				<Dialog
					open={modalOpen}
					onClose={closeModal}
					fullWidth
					sx={{ zIndex: 999999 }}
				>
					{props.dialog({ close: closeModal })}
				</Dialog>
			)}
		</>
	);
};

export default ContextualMenuItem;
