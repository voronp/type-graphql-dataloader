"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApolloServerLoaderPlugin = void 0;
const typedi_1 = require("typedi");
const uuid_1 = require("uuid");
function getContext(requestContext) {
    return requestContext?.contextValue
        ? requestContext.contextValue
        : /* @ts-ignore */
            requestContext.context;
}
const ApolloServerLoaderPlugin = function (option) {
    return {
        requestDidStart: async () => ({
            async didResolveSource(requestContext) {
                Object.assign(getContext(requestContext), {
                    _tgdContext: {
                        requestId: (0, uuid_1.v4)(),
                        typeormGetConnection: option?.typeormGetConnection,
                    },
                });
            },
            async willSendResponse(requestContext) {
                typedi_1.Container.reset(getContext(requestContext)._tgdContext.requestId);
            },
        }),
    };
};
exports.ApolloServerLoaderPlugin = ApolloServerLoaderPlugin;
