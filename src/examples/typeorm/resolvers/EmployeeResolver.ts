import { Query, Resolver } from "type-graphql";
import { Employee } from "../entities/index.js";

@Resolver((of) => Employee)
export default class EmployeeResolver {
  @Query((returns) => [Employee])
  async employees(): Promise<Employee[]> {
    const { getGlobalDataSource } = await import("../index.js");
    return getGlobalDataSource().getRepository(Employee).find();
  }
}
