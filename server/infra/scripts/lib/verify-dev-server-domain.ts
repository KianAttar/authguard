import { readFileSync } from "fs";
import { platform } from "os";
import path from "path";

function checkDevServerInHosts(): boolean {
    const hostsFilePath =
        platform() === "win32"
            ? path.join(
                  process.env.SystemRoot || "C:\\Windows",
                  "System32",
                  "drivers",
                  "etc",
                  "hosts"
              )
            : "/etc/hosts";
    const hostsFileContent = readFileSync(hostsFilePath, "utf8");

    const regex = /^\s*127\.0\.0\.1\s+dev-server\.com\s*$/m;

    if (regex.test(hostsFileContent)) {
        return true;
    }
    return false;
}

export { checkDevServerInHosts };
