import { execSync } from "node:child_process";

function verifyCommandInstallation(cmd: string): boolean {
    const versionCommands = [`-v`, `--version`, `version`];

    for (const versionCommand of versionCommands) {
        try {
            execSync(`${cmd} ${versionCommand}`, { stdio: "ignore" });
            return true;
        } catch (e) {
            // ignore the error
        }
    }
    return false;
}

export { verifyCommandInstallation };
