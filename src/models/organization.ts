import { Command, ThemeIcon, TreeItem, TreeItemCollapsibleState } from "vscode";

export class Organization extends TreeItem {

    constructor(
        public readonly label: string,
        public readonly organizationUrl: string,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public readonly command?: Command
    ) {
        super(label, collapsibleState);
        this.tooltip = organizationUrl;
        this.iconPath = new ThemeIcon('organization');
    }

    contextValue = 'organization';
}