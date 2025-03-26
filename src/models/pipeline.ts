import { TreeItem, TreeItemCollapsibleState, Command, ThemeIcon } from "vscode";
import { ProjectSection } from "./projectSection";

export class Pipeline extends TreeItem {

    constructor(
        public readonly label: string,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public readonly parent?: ProjectSection,
        public readonly command?: Command
    ) {
        super(label, collapsibleState);
        this.iconPath = new ThemeIcon('github-action');
    }
    contextValue = 'pipelines';
}