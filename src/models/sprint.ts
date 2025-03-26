import { TreeItem, TreeItemCollapsibleState, Command, ThemeIcon } from "vscode";
import { ProjectSection } from "./projectSection";

export class Sprint extends TreeItem {

    constructor(
        public readonly label: string,
        public readonly sprintId: string,
        public readonly teamId: string,
        public readonly webUrl: string,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public readonly parent?: ProjectSection,
        public readonly command?: Command
    ) {
        super(label, collapsibleState);
        this.iconPath = new ThemeIcon('list-tree');
    }
    contextValue = 'sprint';
}