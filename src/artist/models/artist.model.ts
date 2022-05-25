import { AutoIncrement, BeforeCreate, BeforeUpdate, BelongsTo, Column, DataType, Default, ForeignKey, HasMany, Is, Model, Table, Unique } from 'sequelize-typescript';
import { Album } from 'src/album/models/album.model';
import { Slug } from 'src/slug/slug';
import { SluggedModel } from 'src/slug/slugged-model';

@Table({ tableName: 'artists' })
export class Artist extends SluggedModel {
	@Column({ allowNull: false })
	name: string;

	@HasMany(() => Album)
	albums: Album[];

	get slugSource(): string {
		return this.name;
	}
}