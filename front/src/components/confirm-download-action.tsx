import { useConfirm } from "material-ui-confirm";
import { translate } from "../i18n/translate";

const confirmDownloadAction = (
	confirm: ReturnType<typeof useConfirm>,
	downloadUrl: string,
) => {
	confirm({
		title: translate("warning"),
		description: translate("downloadWarning"),
		confirmationText: translate("download"),
		confirmationButtonProps: {
			color: "error",
			variant: "outlined",
			href: downloadUrl,
		},
	});
};

export default confirmDownloadAction;
