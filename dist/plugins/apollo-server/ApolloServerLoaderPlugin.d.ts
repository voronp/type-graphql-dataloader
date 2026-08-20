import type { ApolloServerPlugin, BaseContext } from "@apollo/server";
import type { DataSource } from "typeorm";
interface ApolloServerLoaderPluginOption {
    typeormGetConnection?: () => DataSource;
}
export declare const ApolloServerLoaderPlugin: <TContext extends BaseContext = BaseContext>(option?: ApolloServerLoaderPluginOption) => ApolloServerPlugin<TContext>;
export {};
