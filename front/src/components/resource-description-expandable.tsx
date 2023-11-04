import {
	Box, Container, Link
} from "@mui/material";
import ExternalId from "../models/external-id";
import Translate from "../i18n/translate";
import { useState } from "react";

type Props = {
	externalDescription: ExternalId
}

const ResourceDescriptionExpandable = ({ externalDescription }: Props) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const maxLine = 5;
	const smallBoxStyle = {
		overflow: 'hidden',
		display: '-webkit-box',
		WebkitLineClamp: maxLine,
		lineClamp: maxLine,
		WebkitBoxOrient: 'vertical'
	} as const;
	const bigBoxStyle = {};

	return <Container maxWidth={false}>
		<Box id="description" sx={isExpanded ? bigBoxStyle : smallBoxStyle}>
			{externalDescription.description}
			{isExpanded && <>
				{" Source: "}<Link href={externalDescription.url} rel="noopener noreferrer" target="_blank">
					{externalDescription.provider.name}
				</Link>
			</>}
			{" "}<Link href="#description" onClick={() => setIsExpanded(!isExpanded)}>
				<Translate translationKey={isExpanded ? 'showLess' : 'showMore'}/>
			</Link>
		</Box>
	</Container>;
};

export default ResourceDescriptionExpandable;
