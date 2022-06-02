import { AlbumService } from "./album.service";
import { AlbumType } from "./models/album-type";

describe('Album Service', () => {


	describe('Detect Album Type', () => {

		it('should says its a studio album', () => {
			expect(AlbumService.getAlbumTypeFromName('Into the Skyline')).toBe(AlbumType.StudioRecording);
			expect(AlbumService.getAlbumTypeFromName('Celebration')).toBe(AlbumType.StudioRecording);
			expect(AlbumService.getAlbumTypeFromName('Living Room')).toBe(AlbumType.StudioRecording);
		});

		it('should says its a live album', () => {
			expect(AlbumService.getAlbumTypeFromName('Intimate & Live')).toBe(AlbumType.LiveRecording);
			expect(AlbumService.getAlbumTypeFromName('Some Album (Live)')).toBe(AlbumType.LiveRecording);
			expect(AlbumService.getAlbumTypeFromName('11,000 Click (Live at Brixton)')).toBe(AlbumType.LiveRecording);
		});

		it('should says its a live album', () => {
			expect(AlbumService.getAlbumTypeFromName('Happy BusDay: Best of Superbys')).toBe(AlbumType.Compilation);
			expect(AlbumService.getAlbumTypeFromName('The Very Best of Moby')).toBe(AlbumType.Compilation);
			expect(AlbumService.getAlbumTypeFromName('The Best Mixes From The Album Debut')).toBe(AlbumType.Compilation);
		});

		it('should says its a single', () => {
			expect(AlbumService.getAlbumTypeFromName('Twist - Single')).toBe(AlbumType.Single);
			expect(AlbumService.getAlbumTypeFromName('Falling (Remixes)')).toBe(AlbumType.Single);
		});
	});
});