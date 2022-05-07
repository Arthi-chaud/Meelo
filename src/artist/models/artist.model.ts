import { AutoIncrement, BeforeCreate, BeforeUpdate, BelongsTo, Column, Default, ForeignKey, HasMany, Is, Model, Table, Unique } from 'sequelize-typescript';

@Table({ tableName: 'artists' })
export class Artist extends Model {
	@Column({ allowNull: false })
	name: string;

	@Column({ allowNull: false })
	slug: string;

	@BeforeCreate
	@BeforeUpdate
	static setSlug(instance: Artist) {
		instance.slug = buildSlug(instance.name);
	}
}