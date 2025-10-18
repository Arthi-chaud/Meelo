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

import { Box, IconButton, Paper, Slide } from "@mui/material";
import { useRouter } from "next/router";
import { type ReactNode, useEffect, useState } from "react";
import { CloseIcon } from "@/ui/icons";
import { isClientSideRendering } from "~/utils/is-ssr";

type ModalPageProps = {
	disposable?: boolean;
	children: ReactNode;
	open?: boolean;
};

const ModalPage = (props: ModalPageProps) => {
	const router = useRouter();
	const [open, setOpen] = useState(props.open ?? true);

	useEffect(() => {
		if (open) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "unset";
		}
		return () => {
			document.body.style.overflow = "unset";
		};
	}, [open]);
	return (
		<Slide
			direction="up"
			in={open}
			unmountOnExit
			appear={isClientSideRendering()}
		>
			<Box
				sx={{
					width: "100%",
					height: "100%",
					padding: 2,
					display: "flex",
					position: "fixed",
					right: 0,
					bottom: 0,
					justifyContent: "center",
					alignItems: "center",
					zIndex: "modal",
				}}
			>
				<Paper
					sx={{
						borderRadius: "0.5rem",
						display: "flex",
						width: "100%",
						height: "100%",
						overflowY: "scroll",
						overflowX: "clip",
						paddingX: 3,
						paddingTop: 2,
						flexDirection: "column",
					}}
				>
					<Box
						sx={{
							width: "100%",
							display: "flex",
							justifyContent: "flex-end",
						}}
					>
						<IconButton
							onClick={() => {
								setOpen(false);
								router.back();
							}}
						>
							<CloseIcon
								style={{
									display:
										props.disposable === true
											? undefined
											: "none",
								}}
							/>
						</IconButton>
					</Box>
					{props.children}
				</Paper>
			</Box>
		</Slide>
	);
};

export default ModalPage;
