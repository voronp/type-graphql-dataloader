import { TypeormLoader } from "index.js";
import { Field, ID, ObjectType } from "type-graphql";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { type Lazy } from "../types/Lazy.js";
import { Base } from "./Base.js";
import { Company } from "./Company.js";
import { Desk } from "./Desk.js";

@ObjectType()
@Entity()
export class Chair extends Base<Chair> {
  @Field((type) => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field({ nullable: true })
  @Column({ nullable: true })
  name?: string;

  @Field((type) => Company)
  @ManyToOne((type) => Company, (company) => company.desks)
  @TypeormLoader((type) => Company, (chair: Chair) => chair.companyId)
  company: Company;

  @RelationId((chair: Chair) => chair.company)
  companyId: string;

  @Field((type) => Desk, { nullable: true })
  @OneToOne((type) => Desk, (desk) => desk.chair, {
    lazy: true,
    nullable: true,
  })
  @JoinColumn()
  desk: Lazy<Desk | null>;

  @RelationId((chair: Chair) => chair.desk)
  deskId?: number;
}
