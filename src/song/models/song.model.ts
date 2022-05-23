import { AutoIncrement, BeforeCreate, BeforeUpdate, BelongsTo, Column, Default, ForeignKey, HasMany, HasOne, Is, Model, Table, Unique } from 'sequelize-typescript';
import { Artist } from 'src/artist/models/artist.model';
import { Track } from 'src/track/models/track.model';

@Table({ tableName: 'songs' })
export class Song extends Model {
	@ForeignKey(() => Artist)
	artist: Artist;

	@HasMany(() => Track)
	instances: Track[];

	@Column({ allowNull: false })
	name: string;
}