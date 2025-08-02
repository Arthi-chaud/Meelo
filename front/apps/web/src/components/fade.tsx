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

import { Fade as MUIFade } from "@mui/material";
import type { ComponentProps } from "react";
import { isClientSideRendering } from "~/utils/is-ssr";

/**
 * Wrapper around MUI's Fade.
 * Fade is the main animation used in the app.
 * However, when SSR, the opacity of the child node will be stuck at 0, and no animation is applied
 * This component fixes it.
 */

type FadeProps = ComponentProps<typeof MUIFade>;

const Fade = (props: FadeProps) => {
	return (
		<MUIFade
			{...props}
			appear={(props.appear ?? true) && isClientSideRendering()}
			suppressHydrationWarning
		/>
	);
};

export default Fade;
