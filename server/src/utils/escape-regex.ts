// from https://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default escapeRegex;
