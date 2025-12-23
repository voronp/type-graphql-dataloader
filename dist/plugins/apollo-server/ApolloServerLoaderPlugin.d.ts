import type { ApolloServerPlugin } from "@apollo/server";
import type { DataSource } from "typeorm";
interface ApolloServerLoaderPluginOption {
    typeormGetConnection?: () => DataSource;
}
declare const ApolloServerLoaderPlugin: (option?: ApolloServerLoaderPluginOption) => ApolloServerPlugin;
export { ApolloServerLoaderPlugin };
