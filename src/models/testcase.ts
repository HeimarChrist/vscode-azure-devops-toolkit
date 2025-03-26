import { TreeItem, TreeItemCollapsibleState, Command, ThemeIcon } from "vscode";
import { TestSuite } from "./testsuite";

export class TestCase extends TreeItem {

    constructor(
        public readonly label: string,
        public readonly webUrl: string,
        public readonly testCaseId: number,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public readonly parent?: TestSuite,
        public readonly workItemFields?: any[],
        public readonly command?: Command
    ) {
        super(label, collapsibleState);
        this.iconPath = new ThemeIcon('note');
        this.tooltip = `#${this.testCaseId}`;
    }
    contextValue = 'testCase';
}