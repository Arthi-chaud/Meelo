import { AutoIncrement, BeforeCreate, BeforeUpdate, BelongsTo, Column, Default, ForeignKey, HasMany, HasOne, Is, Model, Table, Unique } from 'sequelize-typescript';
import { Artist } from 'src/artist/models/artist.model';
import { SluggedModel } from 'src/slug/slugged-model';
import { Track } from 'src/track/models/track.model';

/**
 * A song is described by a title, an artist, and 'instanciated' by Tracks
 */
@Table({ tableName: 'songs' })
export class Song extends SluggedModel {
	/**
	 * The artist of the song
	 */
	@ForeignKey(() => Artist)
	artist: Artist;

	/**
	 * The related tracks
	 */
	@HasMany(() => Track)
	instances: Track[];

	/**
	 * The number of times, the song was played
	 */
	@Column({ allowNull: false })
	playCount: number

	/**
	 * The name of the track
	 */
	@Column({ allowNull: false })
	name: string;
	
	get slugSource(): string {
		return this.name;
	}
}