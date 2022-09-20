import { Button, Typography } from "@mui/material";
import Link from "next/link";
import { RequireExactlyOne } from "type-fest";

type ListItemButtonProps = {
	label?: string;
} & RequireExactlyOne<{
	url: string;
	onClick: () => void
}>

const ListItemButton = ({ url, label, onClick }: ListItemButtonProps) => {
	const button = (
		<Button onClick={onClick} variant="text" color='inherit' sx={{ textTransform: 'none', justifyContent: 'left' }}>
			<Typography sx={{ textAlign: 'left' }}>{label}</Typography>
		</Button>
	);
	if (url === undefined)
		return button
	return <Link href={url}>{button}</Link>
}

export default ListItemButton;