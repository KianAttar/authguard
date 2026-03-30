#!/usr/bin/env npx tsx

import { verifyCommandInstallation } from "./lib/verify-cmd-installation.js";
import chalk from "chalk";
const devOpsDeps = ["kubectl", "skaffold"];

devOpsDeps.forEach((cmd) => {
    let exitCode = 0;
    if (!verifyCommandInstallation(cmd)) {
        exitCode = 1;
        console.error(chalk.red(`"${cmd}" command is required, please install it and try again.`));
    }
    process.exit(exitCode);
});
