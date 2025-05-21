declare global {
	namespace PrismaJson {
		type SyncedLyrics = [{ timestamp: number; content: string }];
		type LastFMData = { sessionToken: string };
		type ListenBrainzData = {
			userToken: string;
			instanceUrl: string | null;
		};
	}
}

export {};
