import { Column, Is, Model, Table, Unique } from 'sequelize-typescript';

@Table({ tableName: 'files' })
export class File extends Model {
	@Unique
	@Column({ allowNull: false })
	path: string;

	@Column({ allowNull: false })
	@Is('MD5 Checksum', (value) => RegExp('^[a-f0-9]{32}$').test(value))
	md5Checksum: string;
}