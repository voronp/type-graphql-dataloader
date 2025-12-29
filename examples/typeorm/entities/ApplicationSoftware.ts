import { TypeormLoader } from "index.js";
import { Field, ObjectType } from "type-graphql";
import { Entity, ManyToMany, ManyToOne, PrimaryColumn } from "typeorm";
import { type Lazy } from "../types/Lazy.js";
import { Base } from "./Base.js";
import { Company } from "./Company.js";
import { PersonalComputer } from "./PersonalComputer.js";

@ObjectType()
@Entity()
export class ApplicationSoftware extends Base<ApplicationSoftware> {
  @Field()
  @PrimaryColumn()
  name: string;

  @Field()
  @PrimaryColumn()
  majorVersion: number;

  @Field()
  @PrimaryColumn()
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
