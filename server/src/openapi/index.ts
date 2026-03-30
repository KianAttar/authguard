import yaml from "yaml";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "node:fs";
import path from "node:path";
import { RequestHandler } from "express";

const file = readFileSync(path.join(import.meta.dirname, "openapi.spec.yaml"), "utf8");
const swaggerDocument = yaml.parse(file);
const docsMiddleware = function () {
    return [swaggerUi.serve, swaggerUi.setup(swaggerDocument)] as RequestHandler[];
};

export { docsMiddleware };
