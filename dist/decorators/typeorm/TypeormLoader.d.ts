import type { ObjectType } from "typeorm";
type KeyFunc = (root: any) => any | any[] | undefined;
export interface TypeormLoaderOption {
    selfKey: boolean;
}
export declare function TypeormLoader(): PropertyDecorator;
export declare function TypeormLoader(keyFunc: KeyFunc, option?: TypeormLoaderOption): PropertyDecorator;
export declare function TypeormLoader<V>(typeFunc: (type?: void) => ObjectType<V>, keyFunc: KeyFunc, option?: TypeormLoaderOption): PropertyDecorator;
export {};
