/**
 * Quick *fix* for the format of unparsed release dates from objects received from the API
 */
const getYear = (date: Date | string | null) => date ? new Date(date).getFullYear() : null;

export default getYear;
