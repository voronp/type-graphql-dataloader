import { Container } from "typedi";
import { v4 as uuidv4 } from "@lukeed/uuid";
function getContext(requestContext) {
    return requestContext?.contextValue
        ? requestContext.contextValue
        : /* @ts-ignore */
            requestContext.context;
}
export const ApolloServerLoaderPlugin = function (option) {
    return {
        requestDidStart: async () => ({
            async didResolveSource(requestContext) {
                Object.assign(getContext(requestContext), {
                    _tgdContext: {
                        requestId: uuidv4(),
                        typeormGetConnection: option?.typeormGetConnection,
                    },
                });
            },
            async willSendResponse(requestContext) {
                Container.reset(getContext(requestContext)._tgdContext.requestId);
            },
        }),
    };
};
