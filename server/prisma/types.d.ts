declare global {
	namespace PrismaJson {
		type SyncedLyrics = [{ timestamp: number; content: string }];
	}
}
