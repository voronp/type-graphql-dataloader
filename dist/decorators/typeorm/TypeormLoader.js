"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeormLoader = TypeormLoader;
const ExplicitLoaderImpl_1 = require("./ExplicitLoaderImpl");
const ImplicitLoaderImpl_1 = require("./ImplicitLoaderImpl");
function TypeormLoader(typeFuncOrKeyFunc, keyFuncOrOption, option) {
    if (typeFuncOrKeyFunc == null) {
        return (0, ImplicitLoaderImpl_1.ImplicitLoaderImpl)();
    }
    const getArgs = () => {
        return option != null || typeof keyFuncOrOption == "function"
            ? [keyFuncOrOption, option]
            : [typeFuncOrKeyFunc, keyFuncOrOption];
    };
    return (0, ExplicitLoaderImpl_1.ExplicitLoaderImpl)(...getArgs());
}
