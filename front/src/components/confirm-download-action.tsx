import { useConfirm } from "material-ui-confirm";

const confirmDownloadAction = (
	confirm: ReturnType<typeof useConfirm>, downloadUrl: string
) => {
	confirm({
		title: "Warning",
		description: "Downloading copyrighted material you don't own is not authorized. Please proceed if, and only if, you own the original content.",
		confirmationText: "Download",
		confirmationButtonProps: { color: 'error', variant: 'outlined', href: downloadUrl }
	});
};

export default confirmDownloadAction;
