import { Command, ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";
import { Organization } from "./organization";

export class Project extends TreeItem {

    constructor(
        public readonly label: string,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public readonly parent?: Organization,
        public readonly command?: Command
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}`;
        this.iconPath = new ThemeIcon('project');
    }

    contextValue = 'project';
}