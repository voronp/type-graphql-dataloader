import { ExplicitLoaderImpl } from "./ExplicitLoaderImpl.js";
import { ImplicitLoaderImpl } from "./ImplicitLoaderImpl.js";
export function TypeormLoader(typeFuncOrKeyFunc, keyFuncOrOption, option) {
    if (typeFuncOrKeyFunc == null) {
        return ImplicitLoaderImpl();
    }
    const getArgs = () => {
        return option != null || typeof keyFuncOrOption == "function"
            ? [keyFuncOrOption, option]
            : [typeFuncOrKeyFunc, keyFuncOrOption];
    };
    return ExplicitLoaderImpl(...getArgs());
}
