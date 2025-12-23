"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImplicitLoaderImpl = ImplicitLoaderImpl;
const dataloader_1 = __importDefault(require("dataloader"));
const type_graphql_1 = require("type-graphql");
const typedi_1 = __importDefault(require("typedi"));
function ImplicitLoaderImpl() {
    return (target, propertyKey) => {
        (0, type_graphql_1.UseMiddleware)(async ({ root, context }, next) => {
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
    const container = typedi_1.default.of(requestId);
    if (!container.has(serviceId)) {
        container.set(serviceId, new dataloaderCls(relation, typeormGetConnection()));
    }
    const dataloader = container.get(serviceId);
    const columns = relation.entityMetadata.primaryColumns;
    const pk = columns.map((c) => c.getEntityValue(root));
    return await dataloader.load(JSON.stringify(pk));
}
class ToOneOwnerDataloader extends dataloader_1.default {
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
class ToOneNotOwnerDataloader extends dataloader_1.default {
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
class OneToManyDataloader extends dataloader_1.default {
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
class ManyToManyDataloader extends dataloader_1.default {
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
    const { Brackets } = await Promise.resolve().then(() => __importStar(require("typeorm")));
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
            entitiesByRelationKey[key] ?? (entitiesByRelationKey[key] = []);
            entitiesByRelationKey[key].push(entity);
        });
    }
    return entitiesByRelationKey;
}
