import { RequestDataValidationError } from "@mssd/errors";
import { output, ZodObject, ZodRawShape } from "zod";

interface ObjectValidatorOptions {
    abortEarly?: boolean;
}
const defaultOptions: Partial<ObjectValidatorOptions> = {
    abortEarly: true
};

async function dataValidator<T extends ZodRawShape, S extends Record<string, ZodObject<T>>>(
    schemas: { [K in keyof S]: S[K] },
    // obj: { [K in keyof S]: input<S[K]> }
    obj: any,
    options: ObjectValidatorOptions = defaultOptions
) {
    // Map each key in `schemas` to the Zod output type of its ZodObject schema
    type Result = {
        [K in keyof S]: output<S[K]>;
    };
    const res = {} as Result;
    const issues = [];
    for (const key in schemas) {
        const { error, data } = await schemas[key].safeParseAsync(obj[key]);
        if (error) {
            if (options.abortEarly) throw new RequestDataValidationError(error.issues);
            issues.push(...error.issues);
            continue;
        }
        res[key] = data;
    }
    if (issues.length > 0) {
        throw new RequestDataValidationError(issues);
    }
    return res;
}

export { dataValidator };
