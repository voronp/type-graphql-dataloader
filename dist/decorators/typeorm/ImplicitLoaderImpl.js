import DataLoader from "dataloader";
import { UseMiddleware } from "type-graphql";
import { Container } from "typedi";
export function ImplicitLoaderImpl() {
    return (target, propertyKey) => {
        UseMiddleware(async ({ root, context }, next) => {
            const tgdContext = context._tgdContext;
            if (tgdContext.typeormGetConnection == null) {
                throw Error("typeormGetConnection is not set");
            }
            const relation = tgdContext
                .typeormGetConnection()
                .getMetadata(target.constructor)
                .findRelationWithPropertyPath(propertyKey.toString());
            if (relation == null) {
                return await next();
            }
            if (relation.inverseRelation == null) {
                throw Error(`inverseRelation is required: ${String(propertyKey)}`);
            }
            const dataloaderCls = relation.isOneToOneOwner || relation.isManyToOne
                ? ToOneOwnerDataloader
                : relation.isOneToOneNotOwner
                    ? ToOneNotOwnerDataloader
                    : relation.isOneToMany
                        ? OneToManyDataloader
                        : relation.isManyToMany
                            ? ManyToManyDataloader
                            : null;
            if (dataloaderCls == null) {
                return await next();
            }
            return await handler(root, tgdContext, relation, dataloaderCls);
        })(target, propertyKey);
    };
}
async function handler(root, { requestId, typeormGetConnection }, relation, dataloaderCls) {
    if (typeormGetConnection == null) {
        throw Error("Connection is not available");
    }
    const serviceId = `tgd-typeorm#${relation.entityMetadata.tableName}#${relation.propertyName}`;
    const container = Container.of(requestId);
    if (!container.has(serviceId)) {
        container.set(serviceId, new dataloaderCls(relation, typeormGetConnection()));
    }
    const dataloader = container.get(serviceId);
    const columns = relation.entityMetadata.primaryColumns;
    const pk = columns.map((c) => c.getEntityValue(root));
    return await dataloader.load(JSON.stringify(pk));
}
class ToOneOwnerDataloader extends DataLoader {
    constructor(relation, connection) {
        super(async (pks) => {
            const relationName = relation.inverseRelation.propertyName;
            const columns = relation.entityMetadata.primaryColumns;
            const entities = await findEntities(relation, connection, pks, relationName, columns);
            const referencedColumnNames = columns.map((c) => c.propertyPath);
            const entitiesByRelationKey = await getEntitiesByRelationKey(entities, relationName, referencedColumnNames);
            return pks.map((pk) => entitiesByRelationKey[pk]?.[0] ?? null);
        });
    }
}
class ToOneNotOwnerDataloader extends DataLoader {
    constructor(relation, connection) {
        super(async (pks) => {
            const inverseRelation = relation.inverseRelation;
            const relationName = relation.propertyName;
            const columns = inverseRelation.joinColumns;
            const entities = await findEntities(relation, connection, pks, relationName, columns);
            const referencedColumnNames = columns.map((c) => c.referencedColumn.propertyPath);
            const entitiesByRelationKey = await getEntitiesByRelationKey(entities, inverseRelation.propertyName, referencedColumnNames);
            return pks.map((pk) => entitiesByRelationKey[pk]?.[0] ?? null);
        });
    }
}
class OneToManyDataloader extends DataLoader {
    constructor(relation, connection) {
        super(async (pks) => {
            const inverseRelation = relation.inverseRelation;
            const columns = inverseRelation.joinColumns;
            const entities = await findEntities(relation, connection, pks, relation.propertyName, columns);
            const referencedColumnNames = columns.map((c) => c.referencedColumn.propertyPath);
            const entitiesByRelationKey = await getEntitiesByRelationKey(entities, inverseRelation.propertyName, referencedColumnNames);
            return pks.map((pk) => entitiesByRelationKey[pk] ?? []);
        });
    }
}
class ManyToManyDataloader extends DataLoader {
    constructor(relation, connection) {
        super(async (pks) => {
            const inversePropName = relation.inverseRelation.propertyName;
            const { ownerColumns, inverseColumns } = relation.junctionEntityMetadata;
            const [relationName, columns] = relation.isManyToManyOwner
                ? [`${inversePropName}_${relation.propertyPath}`, ownerColumns]
                : [`${relation.propertyName}_${inversePropName}`, inverseColumns];
            const entities = await findEntities(relation, connection, pks, relationName, columns);
            const referencedColumnNames = columns.map((c) => c.referencedColumn.propertyPath);
            const entitiesByRelationKey = await getEntitiesByRelationKey(entities, inversePropName, referencedColumnNames);
            return pks.map((pk) => entitiesByRelationKey[pk] ?? []);
        });
    }
}
async function findEntities(relation, connection, stringifiedPrimaryKeys, relationName, columnMetas) {
    const { Brackets } = await import("typeorm");
    const qb = connection.createQueryBuilder(relation.type, relation.propertyName);
    if (relation.isOneToOneOwner || relation.isManyToOne) {
        qb.innerJoinAndSelect(`${relation.propertyName}.${relationName}`, relationName);
    }
    else if (relation.isOneToOneNotOwner ||
        relation.isOneToMany ||
        relation.isManyToMany) {
        const inversePropName = relation.inverseRelation.propertyName;
        qb.innerJoinAndSelect(`${relation.propertyName}.${inversePropName}`, inversePropName);
    }
    else {
        throw Error("never");
    }
    const primaryKeys = stringifiedPrimaryKeys.map((pk) => JSON.parse(pk));
    const columns = columnMetas.map((c) => `${relationName}.${c.propertyPath}`);
    const keys = columnMetas.map((c) => `${relationName}_${c.propertyAliasName}`);
    if (columnMetas.length === 1) {
        qb.where(`${columns[0]} IN (:...${keys[0]})`, {
            [keys[0]]: primaryKeys.map((pk) => pk[0]),
        });
    }
    else {
        // handle composite keys
        primaryKeys.forEach((pk, i) => {
            qb.orWhere(new Brackets((exp) => {
                columns.forEach((column, j) => {
                    const key = `${i}_${keys[j]}`;
                    exp.andWhere(`${column} = :${key}`, { [key]: pk[j] });
                });
            }));
        });
    }
    return qb.getMany();
}
async function getEntitiesByRelationKey(entities, inversePropName, referencedColumnNames) {
    const entitiesByRelationKey = {};
    for (const entity of entities) {
        const referencedEntities = [await entity[inversePropName]].flat();
        referencedEntities.forEach((re) => {
            const key = JSON.stringify(referencedColumnNames.map((c) => re[c]));
            entitiesByRelationKey[key] ??= [];
            entitiesByRelationKey[key].push(entity);
        });
    }
    return entitiesByRelationKey;
}
