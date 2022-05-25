import { Logger } from "@nestjs/common";
import { BeforeCreate, BeforeUpdate, Column, DataType, Default, Model, Unique } from "sequelize-typescript";
import { AssociationCreateOptions } from "sequelize-typescript/dist/model/model/association/association-create-options";
import { Slug } from "./slug";

/**
 * Sequelize Model with a slug
 * The model that extends this class must call its constructor with a getter for the slug's source
 */
export abstract class SluggedModel extends Model {
	abstract get slugSource(): string;

	@Column({ allowNull: false })
	slug: string | null;

	buildSlugIfNull(): string {
		if (this.slug == null) {
			this.slug = new Slug(this.slugSource).toString();
		}
		return this.slug;
	}
}