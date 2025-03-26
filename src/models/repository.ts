import { TreeItem, TreeItemCollapsibleState, Command, ThemeIcon } from "vscode";
import { ProjectSection } from "./projectSection";

export class Repository extends TreeItem {

    constructor(
        public readonly label: string,
        public readonly repoId: string,
        public readonly webUrl: string,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public readonly parent?: ProjectSection,
        public readonly command?: Command
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}`;
        this.iconPath = new ThemeIcon('repo');
    }

    contextValue = 'repos';
}