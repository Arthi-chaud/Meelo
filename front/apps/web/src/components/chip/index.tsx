import { Chip as Chip_, Skeleton } from "@mui/material";
import Link from "next/link";
import type { ComponentProps } from "react";

type Props = {
	label: string | undefined;
	href: string | undefined;
	sx?: ComponentProps<typeof Chip_>["sx"]; // Use this to set border color
	variant: "outlined" | "surface";
};
const Chip = ({ label, href, variant, sx }: Props) => {
	return (
		<Link href={href ?? {}}>
			<Chip_
				variant={variant === "outlined" ? "outlined" : "filled"}
				label={label ?? <Skeleton width={"50px"} />}
				sx={sx}
				clickable
			/>
		</Link>
	);
};

export default Chip;
