import { Query, Resolver } from "type-graphql";
import { Cert } from "../entities/index.js";

@Resolver((of) => Cert)
export default class CertResolver {
  @Query((returns) => [Cert])
  async certs(): Promise<Cert[]> {
    const { getGlobalDataSource } = await import("../index.js");
    return getGlobalDataSource().getRepository(Cert).find();
  }
}
