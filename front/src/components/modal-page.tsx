import {
	Box, IconButton, Paper, Slide
} from "@mui/material";
import { useRouter } from "next/router";
import CloseIcon from '@mui/icons-material/Close';
import { useEffect, useState } from "react";

type ModalPageProps = {
	disposable?: boolean;
	children: JSX.Element;
}

const ModalPage = (props: ModalPageProps) => {
	const router = useRouter();
	const [open, setOpen] = useState(true);

	useEffect(() => {
		if (open) {
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = 'unset';
		}
		return () => {
			document.body.style.overflow = 'unset';
		};
	}, [open]);
	return <Slide direction="up" in={open} mountOnEnter unmountOnExit>
		<Box sx={{
			width: '100%', height: '100%', padding: 2, display: 'flex',
			position: 'fixed', right: 0, bottom: 0, justifyContent: 'center',
			alignItems: 'center', zIndex: 'modal'
		}}>
			<Paper sx={{
				borderRadius: '0.5rem', display: 'flex', width: '100%',
				height: '100%', overflowY: 'scroll', overflowX: 'clip',
				paddingX: 3, paddingTop: 2, flexDirection: 'column'
			}}>
				<Box sx={{
					width: '100%', display: 'flex',
					justifyContent: 'flex-end'
				}}>
					<IconButton onClick={() => {
						setOpen(false);
						router.back();
					}}>
						<CloseIcon sx={{ display: props.disposable == true ? undefined : 'none' }} />
					</IconButton>
				</Box>
				{props.children}
			</Paper>
		</Box>
	</Slide>;
};

export default ModalPage;
