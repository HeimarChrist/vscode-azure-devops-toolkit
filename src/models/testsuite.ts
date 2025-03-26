import { TreeItem, TreeItemCollapsibleState, Command, ThemeIcon } from "vscode";
import { TestPlan } from "./testplan";

export class TestSuite extends TreeItem {

    constructor(
        public readonly label: string,
        public readonly testSuiteId: number,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public readonly parent?: TestPlan,
        public readonly command?: Command
    ) {
        super(label, collapsibleState);
        this.iconPath = new ThemeIcon('folder-active');
    }
    contextValue = 'testSuite';
}