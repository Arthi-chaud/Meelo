import { Injectable } from "@nestjs/common";
import { Album, Artist, File, Genre, Library, Release, Song, Track, TrackType } from "@prisma/client";
import PrismaService from "src/prisma/prisma.service";



@Injectable()
export default class TestPrismaService extends PrismaService {

	public library1: Library;
	public library2: Library;

	public genreA: Genre;
	public genreB: Genre;
	public genreC: Genre;

	public artistA: Artist;
	public artistB: Artist;
	public artistC: Artist;
	public songA1: Song;
	public songA2: Song;
	public songB1: Song;
	public songC1: Song;
	public albumA1: Album;
	public albumB1: Album;
	public releaseA1_1: Release;
	public releaseA1_2: Release;
	public releaseB1_1: Release;
	public trackA1_1: Track;
	public trackA1_2Video: Track;
	public trackA2_1: Track;
	public trackB1_1: Track;
	public trackC1_1: Track;
	public fileA1_1: File;
	public fileA1_2Video: File;
	public fileA2_1: File;
	public fileB1_1: File;
	public fileC1_1: File;

	public compilationAlbumA: Album;
	public compilationReleaseA1: Release;

	private baseTrack = {
		bitrate: 0,
		ripSource: null,
		duration: 0,
	}
	
	/**
	 * Creates dummy data and pushes it to the database using the repository service.
	 * It will also clear previous data
	 */
	override async onModuleInit() {
		await this.$connect();
		await this.flushDatabase();
		this.library1 = await this.library.create({
			data: { name: "Library", path: "Music/", slug: 'library'}
		});
		this.library2 = await this.library.create({
			data: { name: "Library 2", path: "Music 2/", slug: 'library-2'}
		});

		this.genreA = await this.genre.create({
			data: { name: 'My Genre A', slug: 'my-genre-a' }
		});

		this.genreB = await this.genre.create({
			data: { name: 'My Genre B', slug: 'my-genre-b' }
		});

		this.genreC = await this.genre.create({
			data: { name: 'My Genre C', slug: 'my-genre-c' }
		});

		this.artistA = await this.artist.create({
			data: { name: "My Artist", slug: "my-artist"}
		});
		this.albumA1 = await this.album.create({
			data: { name: "My Album", slug: 'my-album', artistId: this.artistA.id }
		});
		this.releaseA1_1 = await this.release.create({
			data: { title: "My Album 1", slug: 'my-album-1', albumId: this.albumA1.id, master: true }
		});
		this.releaseA1_2 = await this.release.create({
			data: { title: "My Album 2", slug: 'my-album-2', albumId: this.albumA1.id, master: false }
		});
		this.songA1 = await this.song.create({
			data: { name: "My Song", slug: 'my-song', artistId: this.artistA.id, genres:
				{ connect: { id: this.genreA.id } }
			}
		});
		this.fileA1_1 = await this.file.create({
			data: { path: 'a', md5Checksum: '', registerDate: new Date(), libraryId: this.library1.id }
		});
		this.trackA1_1 = await this.track.create({
			data: { displayName: "My Song 1", ...this.baseTrack, songId: this.songA1.id,
				releaseId: this.releaseA1_1.id, master: true, type: TrackType.Audio, sourceFileId: this.fileA1_1.id
			}
		});
		this.fileA1_2Video = await this.file.create({
			data: { path: 'b', md5Checksum: '', registerDate: new Date(), libraryId: this.library1.id }
		});
		this.trackA1_2Video = await this.track.create({
			data: { ...this.baseTrack, displayName: "My Song 2 (Video)", songId: this.songA1.id,
			releaseId: this.releaseA1_2.id, master: false, type: TrackType.Video, sourceFileId: this.fileA1_2Video.id
		}
		});
		this.songA2 = await this.song.create({
			data: { name: "My Other Song", slug: 'my-other-song', artistId: this.artistA.id, genres:
				{ connect: { id: this.genreB.id } }
			}
		});
		this.fileA2_1 = await this.file.create({
			data: { path: 'c', md5Checksum: '', registerDate: new Date(), libraryId: this.library1.id }
		});
		this.trackA2_1 = await this.track.create({
			data: { ...this.baseTrack, displayName: "My Other Song 1", songId: this.songA2.id,
				releaseId: this.releaseA1_2.id, master: true, type: TrackType.Audio, sourceFileId: this.fileA2_1.id
			}
		});

		this.artistB = await this.artist.create({
			data: { name: "My Second Artist", slug: "my-second-artist"}
		});
		this.albumB1 = await this.album.create({
			data: { name: "My Second Album", slug: 'my-second-album', artistId: this.artistB.id }
		});
		this.releaseB1_1 = await this.release.create({
			data: { title: "My Second Album 1", slug: 'my-second-album-1', albumId: this.albumB1.id, master: true }
		});
		this.songB1 = await this.song.create({
			data: { name: "My Second Song", slug: 'my-second-song', artistId: this.artistB.id, genres:
				{ connect: { id: this.genreB.id } }
			}
		});
		this.fileB1_1 = await this.file.create({
			data: { path: 'a', md5Checksum: '', registerDate: new Date(), libraryId: this.library2.id }
		});
		this.trackB1_1 = await this.track.create({
			data: { ...this.baseTrack, displayName: "My Second Song 1", songId: this.songB1.id,
				releaseId: this.releaseB1_1.id, master: true, type: TrackType.Audio, sourceFileId: this.fileB1_1.id
			}
		});

		this.artistC = await this.artist.create({
			data: { name: "My Third Artist", slug: "my-third-artist"}
		});
		this.compilationAlbumA = await this.album.create({
			data: { name: "My Compilation Album", slug: 'my-compilation-album', artistId: this.artistC.id }
		});
		this.compilationReleaseA1 = await this.release.create({
			data: { title: "My Compilation Album 1", slug: 'my-compilation-album-1', albumId: this.compilationAlbumA.id, master: true }
		});
		this.songC1 = await this.song.create({
			data: { name: "My C Song", slug: 'my-c-song', artistId: this.artistC.id, genres:
				{ connect: { id: this.genreC.id } }
			}
		});
		this.fileC1_1 = await this.file.create({
			data: { path: 'e', md5Checksum: '', registerDate: new Date(), libraryId: this.library1.id }
		});
		this.trackC1_1 = await this.track.create({
			data: { ...this.baseTrack, displayName: "My C Song 1", songId: this.songC1.id,
				releaseId: this.compilationReleaseA1.id, master: true, type: TrackType.Audio, sourceFileId: this.fileC1_1.id
			}
		});

	}

}