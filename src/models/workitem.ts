import { TreeItem, TreeItemCollapsibleState, Command, ThemeIcon } from "vscode";
import { Sprint } from "./sprint";

export class WorkItem extends TreeItem {

	constructor(
		public readonly label: string,
		public readonly workItemId: number,
		public readonly webUrl: string,
		public readonly type: string,
		public readonly collapsibleState: TreeItemCollapsibleState,
		public readonly parent?: Sprint,
		public readonly command?: Command
	) {
		super(label, collapsibleState);
		this.tooltip = `#${this.workItemId}`;
		if (type === 'Bug') {
			this.iconPath = new ThemeIcon('bug');
		}
		else {
			this.iconPath = new ThemeIcon('book');
		}

	}

	contextValue = 'workItem';
}