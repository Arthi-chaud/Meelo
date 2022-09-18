import { Button, Typography } from "@mui/material";
import Link from "next/link";

interface ListItemButtonProps {
	url: string;
	label?: string;
}

const ListItemButton = ({ url, label }: ListItemButtonProps) => {
	return (
		<Link href={url}>
			<Button variant="text" color='inherit' sx={{ textTransform: 'none', justifyContent: 'left' }}>
				<Typography>{label}</Typography>
			</Button>
		</Link>
	)
}

export default ListItemButton;