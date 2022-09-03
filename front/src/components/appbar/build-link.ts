const buildLink = (itemType: string, librarySlug: string): string => {
	let itemRoute = `/${itemType}`;
	if (librarySlug !== '')
		itemRoute = `/libraries/${librarySlug}${itemRoute}`;
	return itemRoute;
}

export default buildLink;