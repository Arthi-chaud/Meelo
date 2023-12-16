import { Box, Button } from "@mui/material";
import ExternalId from "../models/external-id";
import Illustration from "./illustration";
import Link from "next/link";

type ExternalIdBadgeProps = {
	externalId: ExternalId;
};

const ExternalIdBadge = ({ externalId }: ExternalIdBadgeProps) => {
	const badge = (
		<Button
			variant="outlined"
			startIcon={
				<Box sx={{ width: 30 }}>
					<Illustration
						url={externalId.provider.icon}
						quality="original"
					/>
				</Box>
			}
		>
			{externalId.provider.name}
		</Button>
	);

	if (externalId.url) {
		return (
			<Link
				href={externalId.url ?? undefined}
				rel="noopener noreferrer"
				target="_blank"
			>
				{badge}
			</Link>
		);
	}
	return badge;
};

export default ExternalIdBadge;
