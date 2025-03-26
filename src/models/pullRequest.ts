import { Command, ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";
import { Repository } from "./repository";

export class PullRequest extends TreeItem {

    constructor(
        public readonly label: string,
        public readonly pullRequestId: number,
        public readonly webUrl: string,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public readonly parent?: Repository,
        public readonly command?: Command
    ) {
        super(label, collapsibleState);
        this.tooltip = `#${this.pullRequestId}`;
        this.iconPath = new ThemeIcon('git-pull-request');
    }
    contextValue = 'pullRequests';
}