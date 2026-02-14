import type Label from "@/models/label";
import { Chip } from "~/components/chip";
import { useContextMenu } from "~/components/context-menu";
import { useLabelContextMenu } from "~/components/context-menu/resource/label";

type Props = { label: Label | undefined };

export const LabelChip = ({ label }: Props) => {
	const ctxMenu = useLabelContextMenu(label);
	const { openContextMenu } = useContextMenu(ctxMenu);
	return <Chip title={label?.name} onPress={openContextMenu} />;
};
