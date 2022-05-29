import { AutoIncrement, BeforeCreate, BeforeUpdate, BelongsTo, Column, Default, ForeignKey, HasMany, HasOne, Is, Model, Table, Unique } from 'sequelize-typescript';
import { Artist } from 'src/artist/models/artist.model';
import { Track } from 'src/track/models/track.model';

/**
 * A song is described by a title, an artist, and 'instanciated' by Tracks
 */
@Table({ tableName: 'songs' })
export class Song extends Model {
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
	 * The name of the track
	 */
	@Column({ allowNull: false })
	name: string;
}