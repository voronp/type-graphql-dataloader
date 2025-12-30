import { Field, ObjectType } from "type-graphql";
import { Column, Entity, ManyToMany, ManyToOne, PrimaryColumn } from "typeorm";
import { type Lazy } from "../types/Lazy.js";
import { Base, Company, PersonalComputer } from "./index.js";
import { TypeormLoader } from "../../../decorators/typeorm/TypeormLoader.js";

@ObjectType()
@Entity()
export class ApplicationSoftware extends Base<ApplicationSoftware> {
  @Field()
  @PrimaryColumn()
  id: number;

  @Field()
  @Column({ nullable: true })
  name: string;

  @Field()
  @Column({ nullable: true })
  majorVersion: number;

  @Field()
  @Column({ nullable: true })
  minorVersion: number;

  @Field((type) => [PersonalComputer])
  @ManyToMany((type) => PersonalComputer, (pc) => pc.installedApps)
  @TypeormLoader()
  installedComputers: PersonalComputer[];

  @Field((type) => Company)
  @ManyToOne((type) => Company, (company) => company.publishedApps, {
    lazy: true,
  })
  @TypeormLoader()
  publishedBy: Lazy<Company>;
}
