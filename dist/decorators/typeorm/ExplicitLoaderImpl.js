import DataLoader from "dataloader";
import { groupBy, keyBy } from "lodash-es";
import { UseMiddleware } from "type-graphql";
import { Container } from "typedi";
export function ExplicitLoaderImpl(keyFunc, option) {
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
            if (option?.selfKey &&
                !(relation.isOneToMany || relation.isOneToOneNotOwner)) {
                throw Error("selfKey option is available only for OneToMany or OneToOneNotOwner");
            }
            // prettier-ignore
            const handle = relation.isManyToOne || relation.isOneToOneOwner ?
                handleToOne :
                relation.isOneToMany ?
                    option?.selfKey ?
                        handleOneToManyWithSelfKey :
                        handleToMany :
                    relation.isOneToOneNotOwner ?
                        option?.selfKey ?
                            handleOneToOneNotOwnerWithSelfKey :
                            handleToOne :
                        relation.isManyToMany ?
                            handleToMany :
                            () => next();
            return await handle(keyFunc, root, tgdContext, relation);
        })(target, propertyKey);
    };
}
async function handler({ requestId, typeormGetConnection }, relation, columns, newDataloader, callback) {
    if (typeormGetConnection == null) {
        throw Error("Connection is not available");
    }
    if (columns.length !== 1) {
        throw Error("Loading by multiple columns as foreign key is not supported.");
    }
    const serviceId = `tgd-typeorm#${relation.entityMetadata.tableName}#${relation.propertyName}`;
    const container = Container.of(requestId);
    if (!container.has(serviceId)) {
        container.set(serviceId, newDataloader(typeormGetConnection()));
    }
    return callback(container.get(serviceId), columns);
}
async function handleToMany(foreignKeyFunc, root, tgdContext, relation) {
    return handler(tgdContext, relation, relation.inverseEntityMetadata.primaryColumns, (connection) => new ToManyDataloader(relation, connection), async (dataloader) => {
        const fks = foreignKeyFunc(root);
        return await dataloader.loadMany(fks);
    });
}
async function handleToOne(foreignKeyFunc, root, tgdContext, relation) {
    return handler(tgdContext, relation, relation.inverseEntityMetadata.primaryColumns, (connection) => new ToOneDataloader(relation, connection), async (dataloader) => {
        const fk = foreignKeyFunc(root);
        return fk != null ? await dataloader.load(fk) : null;
    });
}
async function handleOneToManyWithSelfKey(selfKeyFunc, root, tgdContext, relation) {
    return handler(tgdContext, relation, relation.entityMetadata.primaryColumns, (connection) => new SelfKeyDataloader(relation, connection, selfKeyFunc), async (dataloader, columns) => {
        const pk = columns[0].getEntityValue(root);
        return await dataloader.load(pk);
    });
}
async function handleOneToOneNotOwnerWithSelfKey(selfKeyFunc, root, tgdContext, relation) {
    return handler(tgdContext, relation, relation.entityMetadata.primaryColumns, (connection) => new SelfKeyDataloader(relation, connection, selfKeyFunc), async (dataloader, columns) => {
        const pk = columns[0].getEntityValue(root);
        return (await dataloader.load(pk))[0] ?? null;
    });
}
function directLoader(relation, connection, grouper) {
    return async (ids) => {
        const entities = keyBy(await connection
            .createQueryBuilder(relation.type, relation.propertyName)
            .whereInIds(ids)
            .getMany(), grouper);
        return ids.map((id) => entities[id]);
    };
}
class ToManyDataloader extends DataLoader {
    constructor(relation, connection) {
        super(directLoader(relation, connection, (entity) => relation.inverseEntityMetadata.primaryColumns[0].getEntityValue(entity)));
    }
}
class ToOneDataloader extends DataLoader {
    constructor(relation, connection) {
        super(directLoader(relation, connection, relation.inverseEntityMetadata.primaryColumns[0].propertyName));
    }
}
class SelfKeyDataloader extends DataLoader {
    constructor(relation, connection, selfKeyFunc) {
        super(async (ids) => {
            const columns = relation.inverseRelation.joinColumns;
            const k = `${relation.propertyName}_${columns[0].propertyName}`;
            const entities = groupBy(await connection
                .createQueryBuilder(relation.type, relation.propertyName)
                .where(`${relation.propertyName}.${columns[0].propertyPath} IN (:...${k})`)
                .setParameter(k, ids)
                .getMany(), selfKeyFunc);
            return ids.map((id) => entities[id] ?? []);
        });
    }
}
