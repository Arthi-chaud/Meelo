import { AutoIncrement, BeforeCreate, BeforeUpdate, BelongsTo, Column, Default, ForeignKey, HasMany, HasOne, Is, Model, Table, Unique } from 'sequelize-typescript';
import { Album } from 'src/album/models/album.model';
import { Track } from 'src/track/models/track.model';

/**
 * A release is 'an instance' of an Album
 */
@Table({ tableName: 'releases' })
export class Release extends Model {
	/**
	 * The related album
	 */
	@ForeignKey(() => Album)
	album: Album;

	/**
	 * The name of the release, if it has one
	 * If none, the album's title will be used
	 */
	@Column
	title: string | null;

	/**
	 * The date of the release
	 */
	@Column
	releaseDate: Date | null;

	/**
	 * Is this release the 'main' / 'most used' version of the Album
	 */
	@Column({ allowNull: false })
	master: boolean;

	/**
	 * The tracks on the release
	 */
	@HasMany(() => Track)
	tracks: Track[];
}