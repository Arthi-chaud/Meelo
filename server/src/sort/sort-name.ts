const articles = ["the", "a", "an"];
export function getSortName(s: string): string {
	// Apostrophe
	const wordsA = s.split("'", 2);
	if (wordsA.at(0)?.toLowerCase() === "l") {
		return `${wordsA[1]}, ${wordsA[0]}'`;
	}
	// Regular word
	const words = s.split(" ");
	if (articles.includes(words.at(0)?.toLocaleLowerCase() ?? "")) {
		return `${words.slice(1).join(" ")}, ${words[0]}`;
	}
	return s;
}
