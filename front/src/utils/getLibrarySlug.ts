/**
 * As libraries' items pages are rewritten to '/:item', the library slug is lost in translation
 * This function takes router.url as parameter and find the library slug in it.
 * If the original route was not for a library, returns null
 * @returns
 */
// eslint-disable-next-line no-useless-escape
const getLibrarySlug = (url: string) => url.match('\/libraries\/(?<slug>[^\/]*)\/.*')?.at(1) ?? null;

export default getLibrarySlug;
