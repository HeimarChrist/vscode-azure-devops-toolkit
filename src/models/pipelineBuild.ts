import { BuildResult } from "azure-devops-node-api/interfaces/BuildInterfaces";
import { TreeItem, TreeItemCollapsibleState, Command, ThemeIcon } from "vscode";
import { Pipeline } from "./pipeline";

export class PipelineBuild extends TreeItem {

    constructor(
        public readonly label: string,
        public readonly status: BuildResult,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public readonly parent?: Pipeline,
        public readonly command?: Command
    ) {
        super(label, collapsibleState);
        this.iconPath = new ThemeIcon('build');
        switch (status) {
            case BuildResult.Canceled:
                this.iconPath = new ThemeIcon('circle-slash');
                break;
            case BuildResult.Failed:
                this.iconPath = new ThemeIcon('testing-error-icon');
                break;
            case BuildResult.PartiallySucceeded:
                this.iconPath = new ThemeIcon('warning');
                break;
            case BuildResult.Succeeded:
                this.iconPath = new ThemeIcon('testing-passed-icon');
                break;
        }
    }
}