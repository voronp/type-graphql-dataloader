import { Field, ID, ObjectType } from "type-graphql";
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from "typeorm";
import type { Lazy } from "../types/Lazy.js";
import { Base, Company, Desk, ApplicationSoftware } from "./index.js";
import { TypeormLoader } from "../../../decorators/typeorm/TypeormLoader.js";

@ObjectType()
@Entity()
export class PersonalComputer extends Base<PersonalComputer> {
  @Field((type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  name?: string;

  @Field((type) => Company)
  @ManyToOne((type) => Company, (company) => company.desktopComputers)
  @TypeormLoader()
  propertyOf: Company;

  @Field((type) => Desk, { nullable: true })
  @OneToOne((type) => Desk, (desk) => desk.desktopComputer, {
    nullable: true,
    lazy: true,
  })
  @JoinColumn()
  @TypeormLoader()
  placedAt: Lazy<Desk | null>;

  @Field((type) => [ApplicationSoftware])
  @ManyToMany((type) => ApplicationSoftware, (app) => app.installedComputers)
  @JoinTable()
  @TypeormLoader()
  installedApps: ApplicationSoftware[];
}
