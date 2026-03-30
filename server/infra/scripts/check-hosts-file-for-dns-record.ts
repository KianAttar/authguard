#!/usr/bin/env npx tsx
import { platform } from "node:os";
import { checkDevServerInHosts } from "./lib/verify-dev-server-domain.js";
import chalk from "chalk";

if (!checkDevServerInHosts()) {
    console.error(
        chalk.red(
            "dev-server.com domain record is not found in system hosts file. Insert it using the following command: \n"
        )
    );
    if (platform() === "win32") {
        console.log(chalk.yellow("Run the following command in Command Prompt as Administrator:"));
        console.log(
            chalk.green(
                `echo 127.0.0.1   dev-server.com >> C:\\Windows\\System32\\drivers\\etc\\hosts`
            )
        );
    } else {
        console.log(chalk.yellow("Run the following command in Terminal with sudo:"));
        console.log(chalk.green(`echo '127.0.0.1   dev-server.com' | sudo tee -a /etc/hosts`));
    }
    process.exit(1);
}
