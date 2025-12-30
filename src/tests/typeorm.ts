process.env.NODE_ENV = "test";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";

import { gql, request } from "graphql-request";
import { ObjectLiteral, DataSource, getConnectionManager } from "typeorm";
import { connect, listen, seed } from "../examples/typeorm/index.js";
import { Company } from "../examples/typeorm/entities/Company.js";
import { ApplicationSoftware } from "../examples/typeorm/entities/ApplicationSoftware.js";
import {
  Cert,
  Chair,
  PersonalComputer,
  Desk,
  Employee,
} from "../examples/typeorm/entities/index.js";
import typeormResolvers from "../examples/typeorm/resolvers/index.js";

let close: () => Promise<void>;
let endpoint: string;
let dataSource: DataSource;

before(async () => {
  dataSource = await connect(false);
  await seed();

  const { port, close: _close } = await listen(0, typeormResolvers);
  console.log("Server started on ephemeral port", port);
  close = _close;
  endpoint = `http://localhost:${port}/graphql`;
});

after(async () => {
  await close?.();
  await dataSource?.destroy();
});

const objectTypes = {
  Company,
  Employee,
  Desk,
  Chair,
  Cert,
  ApplicationSoftware,
  PersonalComputer,
};

type typename =
  | "Company"
  | "Employee"
  | "Desk"
  | "Chair"
  | "Cert"
  | "ApplicationSoftware"
  | "PersonalComputer";

const coalesceTypeNames = (objects: ObjectLiteral[]): typename => {
  const typename = objects
    .map((a) => a.__typename)
    .reduce((a, b) => (a === b ? a : null));
  if (typename == null) {
    throw Error("typename mismatch");
  }
  return typename;
};

const verify = async <Entity extends ObjectLiteral>(
  objectOrObjects: ObjectLiteral | ObjectLiteral[],
  entityOrEntities: Entity | Entity[]
) => {
  if (Array.isArray(objectOrObjects)) {
    if (!Array.isArray(entityOrEntities)) {
      throw Error("entityOrEntities type mismatch");
    }

    const entities = entityOrEntities;
    const objects = objectOrObjects;

    assert.strictEqual(objects.length, entities.length);
    if (objects.length === 0) {
      return;
    }
    coalesceTypeNames(objects);

    await Promise.all(
      objects.map((object) => {
        const entity = entities.find((entity) => entity.name === object.name);
        if (entity == null) {
          throw Error("Corresponding entity was not found");
        }
        return verify(object, entity);
      })
    );
  } else {
    if (Array.isArray(entityOrEntities)) {
      throw Error("entityOrEntities type mismatch");
    }
    const obj = objectOrObjects;
    const entity = entityOrEntities;
    assert.strictEqual(obj.name, entity.name);

    await Promise.all(
      Object.keys(obj).map(async (k) => {
        const nextObj = obj[k];
        const getSelfEntity = async () =>
          (await dataSource
            .getRepository(objectTypes[obj.__typename as typename])
            .findOneOrFail({
              where: { name: obj.name },
              relations: [k],
            })) as any;

        if (Array.isArray(nextObj)) {
          // ToMany field
          const nextEntities = await (await getSelfEntity())[k];
          return verify(nextObj, nextEntities);
        } else {
          // ToOne field (null)
          if (nextObj == null) {
            assert.strictEqual(await (await getSelfEntity())[k], null);
            return;
          }
          // Column field
          const typename = nextObj.__typename as typename;
          if (typename == null) {
            return;
          }
          // ToOne field
          const nextEntity = await (await getSelfEntity())[k];
          return verify(nextObj, nextEntity);
        }
      })
    );
  }
};

test("verify query companies", async () => {
  const query = gql`
    query {
      companies {
        __typename
        name
        employees {
          __typename
          name
          company {
            __typename
            name
            employees {
              __typename
              name
            }
          }
        }
        desks {
          __typename
          name
          company {
            __typename
            name
          }
        }
        chairs {
          __typename
          name
          company {
            __typename
            name
            chairs {
              __typename
              name
            }
          }
        }
        desktopComputers {
          __typename
          name
        }
        publishedApps {
          __typename
          name
          publishedBy {
            __typename
            name
          }
          installedComputers {
            __typename
            name
            placedAt {
              __typename
              name
            }
          }
        }
      }
    }
  `;
  const data = (await request(endpoint, query)) as { companies: Company[] };
  await verify(data.companies, await dataSource.getRepository(Company).find());
});

test("verify query employees", async () => {
  const query = gql`
    query {
      employees {
        __typename
        name
        company {
          __typename
          name
          publishedApps {
            __typename
            name
          }
        }
        desk {
          __typename
          name
          employee {
            __typename
            name
          }
        }
        certs {
          __typename
          name
        }
      }
    }
  `;
  const data = (await request(endpoint, query)) as { employees: Employee[] };
  await verify(data.employees, await dataSource.getRepository(Employee).find());
});

test("verify query certs", async () => {
  const query = gql`
    query {
      certs {
        __typename
        name
        employees {
          __typename
          name
        }
      }
    }
  `;
  const data = (await request(endpoint, query)) as { certs: Cert[] };
  await verify(data.certs, await dataSource.getRepository(Cert).find());
});

test("verify query desks", async () => {
  const query = gql`
    query {
      desks {
        __typename
        name
        company {
          __typename
          name
        }
        employee {
          __typename
          name
        }
        chair {
          __typename
          name
          company {
            __typename
            name
          }
          desk {
            __typename
            name
            desktopComputer {
              __typename
              name
            }
          }
        }
        desktopComputer {
          __typename
          name
          propertyOf {
            __typename
            name
          }
          placedAt {
            __typename
            name
          }
          installedApps {
            __typename
            name
            installedComputers {
              __typename
              name
            }
            publishedBy {
              __typename
              name
            }
          }
        }
      }
    }
  `;
  const data = (await request(endpoint, query)) as { desks: Desk[] };
  await verify(data.desks, await dataSource.getRepository(Desk).find());
});
