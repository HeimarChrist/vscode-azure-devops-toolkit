import { l10n, window } from "vscode";
import { EXTENSION_OUTPUT_CHANNEL } from "./Constants";

const Logger = window.createOutputChannel(l10n.t(EXTENSION_OUTPUT_CHANNEL), { log: true });
export default Logger;