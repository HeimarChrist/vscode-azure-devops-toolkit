// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { AzureDevopsProvider } from './providers/azureDevopsProvider';
import { PullRequest } from './models/pullRequest';
import { Repository } from './models/repository';
import { TestCase } from './models/testcase';
import { WorkItem } from './models/workitem';



export async function activate(context: vscode.ExtensionContext) {

	const azureDevopsProvider = new AzureDevopsProvider();
	const treeView = vscode.window.createTreeView('devops-toolkit-view', { treeDataProvider: azureDevopsProvider });
	context.subscriptions.push(treeView);
	context.subscriptions.push(vscode.commands.registerCommand('devops-toolkit.clone', async (item: Repository) => { vscode.commands.executeCommand('git.clone', item.webUrl); }));
	context.subscriptions.push(vscode.commands.registerCommand('devops-toolkit.refresh', async (item) => { azureDevopsProvider.refresh(item); }));
	context.subscriptions.push(vscode.commands.registerCommand('devops-toolkit.openInBrowser', async (item: PullRequest | TestCase | WorkItem) => { vscode.env.openExternal(vscode.Uri.parse(item.webUrl)); }));
}

// This method is called when your extension is deactivated
export function deactivate() { }
