
function buildSlug(...args: string[]): string {
	switch (args.length) {
		case 0:
			throw new Error('buildSlug requires at least one argument');
		case 1:
			return args[0]
				.trim()
				.toLocaleLowerCase()
				.replace(/(-+|[^a-zA-Z0-9])/g, '-')
				.match(/\-?(?<slug>.+[^-])\-?/)[0]; // Remove trailing/leding dashes
		default:
			return buildSlug(buildSlug(args[0]), buildSlug(...args.slice(1)));
	}
}