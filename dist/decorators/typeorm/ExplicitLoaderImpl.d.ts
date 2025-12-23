import type { ObjectLiteral } from "typeorm";
import { TypeormLoaderOption } from "./TypeormLoader";
type KeyFunc = (root: any) => any | any[] | undefined;
export declare function ExplicitLoaderImpl<V extends ObjectLiteral>(keyFunc: KeyFunc, option?: TypeormLoaderOption): PropertyDecorator;
export {};
