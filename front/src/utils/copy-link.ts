import toast from "react-hot-toast";

/**
 * Copy meelo url to clipboard, with hostname
 * @param route the route to copy to clipboard
 */
export default function copyLinkToClipboard(route: string) {
	navigator.clipboard.writeText(location.protocol + '//' + location.host + route);
	toast.success("Link copied to clipboard", { duration: 2000 });
}
