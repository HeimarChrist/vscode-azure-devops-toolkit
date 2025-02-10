// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { AzureDevopsProvider, Repos } from './providers/azureDevopsProvider';
import { MicrosoftProviderId, MicrosoftScopes } from './Utils/Constants';



export async function activate(context: vscode.ExtensionContext) {

	let session: vscode.AuthenticationSession | undefined = await vscode.authentication.getSession(MicrosoftProviderId, MicrosoftScopes, { createIfNone: true });
	const azureDevopsProvider = new AzureDevopsProvider(session);
	const treeView = vscode.window.createTreeView('devops-toolkit-view', { treeDataProvider: azureDevopsProvider });
	context.subscriptions.push(treeView);
	context.subscriptions.push(vscode.commands.registerCommand('devops-toolkit.clone', async (item : Repos) => { vscode.commands.executeCommand('git.clone', item.repoUrl); }));
	context.subscriptions.push(vscode.commands.registerCommand('devops-toolkit.refresh', async (item) => { azureDevopsProvider.refresh(item); }));
}

// This method is called when your extension is deactivated
export function deactivate() {}
