import DataLoader from "dataloader";
import { type MethodAndPropDecorator } from "type-graphql/build/typings/decorators/types";
interface ResolverData {
    context: any;
}
type BatchLoadFn<K, V> = (keys: ReadonlyArray<K>, data: ResolverData) => PromiseLike<ArrayLike<V | Error>>;
export declare function Loader<K, V, C = K>(batchLoadFn: BatchLoadFn<K, V>, options?: DataLoader.Options<K, V, C>): MethodAndPropDecorator;
export {};
