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
  RelationId,
} from "typeorm";
import type { Lazy } from "../types/Lazy.js";
import { Base, Cert, Company, Desk } from "./index.js";
import { TypeormLoader } from "../../../decorators/typeorm/TypeormLoader.js";

@ObjectType()
@Entity()
export class Employee extends Base<Employee> {
  @Field((type) => ID)
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  name?: string;

  @Field((type) => Company, { nullable: true })
  @ManyToOne((type) => Company, (company) => company.employees, { lazy: true })
  @TypeormLoader((type) => Company, (employee: Employee) => employee.companyId)
  @JoinColumn()
  company?: Lazy<Company>;

  //@RelationId((employee: Employee) => employee.company)
  @Column()
  companyId: string;

  @Field((type) => Desk, { nullable: true })
  @OneToOne((type) => Desk, (desk) => desk.employee, {
    nullable: true,
    lazy: true,
  })
  @TypeormLoader((type) => Desk, (employee: Employee) => employee.deskId)
  @JoinColumn()
  desk: Lazy<Desk | null>;

  @Field({ nullable: true })
  @Column({ nullable: true })
  deskId?: number;

  @Field((type) => [Cert])
  @ManyToMany((type) => Cert, (cert) => cert.employees, { lazy: true })
  @JoinTable()
  @TypeormLoader()
  certs: Lazy<Cert[]>;
}
