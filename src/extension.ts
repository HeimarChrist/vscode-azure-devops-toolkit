// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { AzureDevopsProvider, Repos, TestCase, PullRequests, WorkItem } from './providers/azureDevopsProvider';



export async function activate(context: vscode.ExtensionContext) {

	const azureDevopsProvider = new AzureDevopsProvider();
	const treeView = vscode.window.createTreeView('devops-toolkit-view', { treeDataProvider: azureDevopsProvider });
	context.subscriptions.push(treeView);
	context.subscriptions.push(vscode.commands.registerCommand('devops-toolkit.clone', async (item: Repos) => { vscode.commands.executeCommand('git.clone', item.webUrl); }));
	context.subscriptions.push(vscode.commands.registerCommand('devops-toolkit.refresh', async (item) => { azureDevopsProvider.refresh(item); }));
	context.subscriptions.push(vscode.commands.registerCommand('devops-toolkit.openInBrowser', async (item: PullRequests | TestCase | WorkItem) => { vscode.env.openExternal(vscode.Uri.parse(item.webUrl)); }));
}

// This method is called when your extension is deactivated
export function deactivate() { }
