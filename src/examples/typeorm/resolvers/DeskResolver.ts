import { Query, Resolver } from "type-graphql";
import { getRepository } from "typeorm";
import { Desk } from "../entities/index.js";

@Resolver((of) => Desk)
export default class DeskResolver {
  @Query((returns) => [Desk])
  async desks(): Promise<Desk[]> {
    return getRepository(Desk).find();
  }
}
