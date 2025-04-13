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

import { Button } from "@mui/material";
import type { useDialogs } from "@toolpad/core";
import type { Translator } from "~/i18n/i18n";

const openDownloadDialog = (
	dialog: ReturnType<typeof useDialogs>,
	downloadUrl: string,
	t: Translator,
) => {
	dialog.confirm(t("downloadWarning"), {
		okText: (
			<Button href={downloadUrl} variant="outlined" color="error">
				{t("download")}
			</Button>
		),
		cancelText: t("cancel"),
		title: t("warning"),
	}); // dialog.open(({ open,  }) => <Dialog
	//        open={open}
	//        onClose={handleClose}
	//        aria-describedby="alert-dialog-slide-description"
	//      >
	//        <DialogTitle>{"Use Google's location service?"}</DialogTitle>
	//        <DialogContent>
	//          <DialogContentText id="alert-dialog-slide-description">
	//            Let Google help apps determine location. This means sending anonymous
	//            location data to Google, even when no apps are running.
	//          </DialogContentText>
	//        </DialogContent>
	//        <DialogActions>
	//          <Button onClick={handleClose}>Disagree</Button>
	//          <Button onClick={handleClose}>Agree</Button>
	//        </DialogActions>
	//      </Dialog>)
	// confirm({
	// 	title: t("warning"),
	// 	description: t("downloadWarning"),
	// 	confirmationText: t("download"),
	// 	confirmationButtonProps: {
	// 		color: "error",
	// 		variant: "outlined",
	// 		href: downloadUrl,
	// 	},
	// });
};

export default openDownloadDialog;
