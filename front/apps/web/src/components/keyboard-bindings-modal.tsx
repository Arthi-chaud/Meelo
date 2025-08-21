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
	DialogContent,
	DialogTitle,
	Grid,
	IconButton,
	List,
	useTheme,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { CloseIcon } from "@/ui/icons";
import {
	useKeyboardBinding,
	useKeyboardBindingContext,
} from "~/contexts/keybindings";
import { useModal } from "./modal";

export const KeyboardBindingModal = () => {
	const [openModal, closeModal] = useModal();
	const { t } = useTranslation();
	useKeyboardBinding(
		{
			key: "?",
			description: "keyboardBindings.openModalShortcutDescription",
			handler: () =>
				openModal(() => (
					<>
						<DialogTitle>
							{t("keyboardBindings.modalTitle")}
						</DialogTitle>
						<IconButton
							onClick={() => closeModal()}
							sx={() => ({
								position: "absolute",
								right: 8,
								top: 8,
							})}
						>
							<CloseIcon />
						</IconButton>
						<DialogContent>
							<KeyboardBindingModalContent />
						</DialogContent>
					</>
				)),
		},
		[],
	);
	return null;
};

const KeyboardBindingModalContent = () => {
	const { t } = useTranslation();
	const { bindings } = useKeyboardBindingContext();
	const theme = useTheme();
	return (
		<List>
			{bindings.map((binding) => (
				<Grid container key={binding.key} spacing={2}>
					<Grid size={{ xs: 4 }} sx={{ textAlign: "center" }}>
						<pre>
							<code
								style={{
									backgroundColor: theme.palette.divider,
									borderColor: theme.palette.divider,
									borderWidth: 1,
									borderStyle: "solid",
									padding: 6,
									borderRadius: theme.shape.borderRadius,
								}}
							>
								{binding.key}
							</code>
						</pre>
					</Grid>
					<Grid
						size={{ xs: 8 }}
						sx={{
							textOverflow: "ellipsis",
							alignContent: "center",
						}}
					>
						{t(binding.description)}
					</Grid>
				</Grid>
			))}
		</List>
	);
};
