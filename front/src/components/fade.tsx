// eslint-disable-next-line no-restricted-imports
import { Fade as MUIFade } from '@mui/material';
import { isClientSideRendering } from '../ssr';
import React from 'react';
/**
 * Wrapper around MUI's Fade.
 * Fade is the main animation used in the app.
 * However, when SSR, the opacity of the child node will be stuck at 0, and no animation is applied
 * This component fixes it.
 */

type FadeProps = Parameters<typeof MUIFade>[0];

const Fade = (props: FadeProps) => {
	return <MUIFade {...props} appear={(props.appear ?? true) && isClientSideRendering()}
		suppressHydrationWarning
	/>;
};

export default Fade;
