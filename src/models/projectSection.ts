import { TreeItem, TreeItemCollapsibleState } from "vscode";
import { Project } from "./project";

export class ProjectSection extends TreeItem {

    constructor(
        public readonly label: string,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public readonly parent?: Project
    ) {
        super(label, collapsibleState);
    }
}