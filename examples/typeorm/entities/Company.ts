import { Field, ID, ObjectType } from "type-graphql";
import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { Lazy } from "../types/Lazy.js";
import { ApplicationSoftware } from "./ApplicationSoftware.js";
import { Base } from "./Base.js";
import { Chair } from "./Chair.js";
import { Desk } from "./Desk.js";
import { Employee } from "./Employee.js";
import { PersonalComputer } from "./PersonalComputer.js";
import { TypeormLoader } from "index.js";

@ObjectType()
@Entity()
export class Company extends Base<Company> {
  @Field((type) => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  name?: string;

  @Field((type) => [Employee])
  @OneToMany((type) => Employee, (employee) => employee.company, { lazy: true })
  @TypeormLoader((employee: Employee) => employee.companyId, { selfKey: true })
  employees: Lazy<Employee[]>;

  @Field((type) => [Desk])
  @OneToMany((type) => Desk, (desk) => desk.company, { lazy: true })
  @TypeormLoader((company: Company) => company.deskIds)
  desks: Lazy<Desk[]>;

  @RelationId((company: Company) => company.desks)
  deskIds: number[];

  @Field((type) => [Chair])
  @OneToMany((type) => Chair, (chair) => chair.company, { lazy: true })
  chairs: Lazy<Chair[]>;

  @Field((type) => [PersonalComputer])
  @OneToMany((type) => PersonalComputer, (pc) => pc.propertyOf, { lazy: true })
  @TypeormLoader()
  desktopComputers: Lazy<PersonalComputer[]>;

  @Field((type) => [ApplicationSoftware])
  @OneToMany((type) => ApplicationSoftware, (app) => app.publishedBy)
  @TypeormLoader()
  publishedApps: ApplicationSoftware[];
}
