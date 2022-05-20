import { AutoIncrement, BeforeCreate, BeforeUpdate, BelongsTo, Column, Default, ForeignKey, HasMany, HasOne, Is, Model, Table, Unique } from 'sequelize-typescript';
import { Album } from 'src/album/models/album.model';
import { Track } from 'src/track/models/track.model';

@Table({ tableName: 'releases' })
export class Release extends Model {
	@ForeignKey(() => Album)
	album: Album;

	@Column
	title: string | null;

	@Column
	releaseDate: Date | null;

	@Column({ allowNull: false })
	master: boolean;

	@HasMany(() => Track)
	tracks: Track[];
}