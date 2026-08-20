import { Query, Resolver } from "type-graphql";
import { Desk } from "../entities/index.js";

@Resolver((of) => Desk)
export default class DeskResolver {
  @Query((returns) => [Desk])
  async desks(): Promise<Desk[]> {
    const { getGlobalDataSource } = await import("../index.js");
    return getGlobalDataSource().getRepository(Desk).find();
  }
}
