import toast from "react-hot-toast";
import { translate } from "../i18n/translate";

/**
 * Copy meelo url to clipboard, with hostname
 * @param route the route to copy to clipboard
 */
export default function copyLinkToClipboard(route: string) {
	navigator.clipboard.writeText(location.protocol + '//' + location.host + route);
	toast.success(translate('linkCopied'));
}
