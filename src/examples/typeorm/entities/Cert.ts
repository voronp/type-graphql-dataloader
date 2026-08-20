import { Field, ID, ObjectType } from "type-graphql";
import {
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { type Lazy } from "../types/Lazy.js";
import { Base, Employee } from "./index.js";
import { TypeormLoader } from "../../../decorators/typeorm/TypeormLoader.js";

@ObjectType()
@Entity()
export class Cert extends Base<Cert> {
  @Field((type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  name?: string;

  @Field((type) => [Employee])
  @ManyToMany((type) => Employee, (employee) => employee.certs, { lazy: true })
  @TypeormLoader()
  employees: Lazy<Employee[]>;
}
