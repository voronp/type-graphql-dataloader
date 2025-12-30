import DataLoader from "dataloader";
import { UseMiddleware } from "type-graphql";
import { Container } from "typedi";
export function Loader(batchLoadFn, options) {
    return (target, propertyKey, descriptor) => {
        UseMiddleware(async ({ context }, next) => {
            const serviceId = `tgd#${target.constructor.name}#${propertyKey.toString()}`;
            const { requestId } = context._tgdContext;
            const container = Container.of(requestId);
            if (!container.has(serviceId)) {
                container.set(serviceId, new DataLoader((keys) => batchLoadFn(keys, { context }), options));
            }
            const dataloader = container.get(serviceId);
            return await (await next())(dataloader);
        })(target, propertyKey);
    };
}
//# sourceMappingURL=Loader.js.map