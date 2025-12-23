import type { TgdContext } from "#/types/TgdContext";
import type {
  ApolloServerPlugin,
  BaseContext,
  GraphQLRequestContextDidResolveSource,
  GraphQLRequestContextWillSendResponse,
} from "@apollo/server";
import { Container } from "typedi";
import type { DataSource } from "typeorm";
import { v4 as uuidv4 } from "uuid";

interface ApolloServerLoaderPluginOption {
  typeormGetConnection?: () => DataSource;
}

function getContext<TContext extends BaseContext = BaseContext>(
  requestContext:
    | GraphQLRequestContextDidResolveSource<TContext>
    | GraphQLRequestContextWillSendResponse<TContext>
) {
  return requestContext?.contextValue
    ? requestContext.contextValue
    : /* @ts-ignore */
      requestContext.context;
}

export const ApolloServerLoaderPlugin = function <
  TContext extends BaseContext = BaseContext
>(option?: ApolloServerLoaderPluginOption): ApolloServerPlugin<TContext> {
  return {
    requestDidStart: async () => ({
      async didResolveSource(
        requestContext: GraphQLRequestContextDidResolveSource<TContext>
      ) {
        Object.assign(getContext<TContext>(requestContext), {
          _tgdContext: {
            requestId: uuidv4(),
            typeormGetConnection: option?.typeormGetConnection,
          } as TgdContext,
        });
      },
      async willSendResponse(requestContext) {
        Container.reset(getContext(requestContext)._tgdContext.requestId);
      },
    }),
  };
};
