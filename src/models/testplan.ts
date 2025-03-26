import { TreeItem, TreeItemCollapsibleState, Command, ThemeIcon } from "vscode";
import { ProjectSection } from "./projectSection";

export class TestPlan extends TreeItem {

    constructor(
        public readonly label: string,
        public readonly testPlanId: number,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public readonly parent?: ProjectSection,
        public readonly command?: Command
    ) {
        super(label, collapsibleState);
        this.iconPath = new ThemeIcon('beaker');
    }
    contextValue = 'testPlan';
}