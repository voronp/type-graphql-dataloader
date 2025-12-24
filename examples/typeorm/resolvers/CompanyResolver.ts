import { Loader } from "index.js";
import DataLoader from "dataloader";
import { groupBy } from "lodash";
import { FieldResolver, Query, Resolver, Root } from "type-graphql";
import { getRepository, In } from "typeorm";
import { Chair } from "../entities/Chair.js";
import { Company } from "../entities/Company.js";

@Resolver((of) => Company)
export default class CompanyResolver {
  @Query((returns) => [Company])
  async companies(): Promise<Company[]> {
    return getRepository(Company).find();
  }

  @FieldResolver()
  @Loader<string, Chair[]>(async (ids: any[]) => {
    const chairs = await getRepository(Chair).find({
      where: { company: { id: In([...ids]) } },
    });
    const chairsById = groupBy(chairs, "companyId");
    return ids.map((id) => chairsById[id] ?? []);
  })
  chairs(@Root() root: Company) {
    return (dataloader: DataLoader<string, Chair[]>) =>
      dataloader.load(root.id);
  }
}
