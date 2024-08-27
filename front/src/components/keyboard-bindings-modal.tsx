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

import { Dialog, DialogContent, DialogTitle, Grid, List } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	useKeyboardBinding,
	useKeyboardBindingContext,
} from "../contexts/keybindings";

export const KeyboardBindingModal = () => {
	const [isOpen, setIsOpen] = useState(false);
	const { t } = useTranslation();
	const _ = useKeyboardBinding({
		key: "?",
		description: "openModalShortcutDescription",
		handler: () => setIsOpen((x) => !x),
	});
	const { bindings } = useKeyboardBindingContext();

	return (
		<Dialog open={isOpen} fullWidth onClose={() => setIsOpen(false)}>
			<DialogTitle>{t("keyboadBindings")}</DialogTitle>
			<DialogContent>
				<List>
					{bindings.map((binding) => (
						<Grid container key={binding.key} spacing={2}>
							<Grid item xs={4} sx={{ textAlign: "center" }}>
								<code>{binding.key}</code>
							</Grid>
							<Grid
								item
								xs={8}
								sx={{
									textOverflow: "ellipsis",
								}}
							>
								{t(binding.description)}
							</Grid>
						</Grid>
					))}
				</List>
			</DialogContent>
		</Dialog>
	);
};
