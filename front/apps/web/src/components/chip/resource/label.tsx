import type Label from "@/models/label";
import Chip from "..";

export const LabelChip = ({ label }: { label: Label | undefined }) => (
	<Chip
		label={label?.name}
		variant="surface"
		href={`/labels/${label?.slug}`}
	/>
);
