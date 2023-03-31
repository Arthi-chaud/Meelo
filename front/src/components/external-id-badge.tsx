import { Box, Button } from "@mui/material";
import Link from "next/link";
import ExternalId from "../models/external-id";
import Illustration from "./illustration";

type ExternalIdBadgeProps = {
	externalId: ExternalId
}

const ExternalIdBadge = ({ externalId }: ExternalIdBadgeProps) => {
	return <Link href={externalId.url}>
		<Button variant="outlined" startIcon={<Box sx={{ width: 30 }}>
			<Illustration url={externalId.provider.icon}/>
		</Box>}>
			{externalId.provider.name }
		</Button>
	</Link>;
}

export default ExternalIdBadge;