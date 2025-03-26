import { authentication, extensions, QuickPickItem, window } from "vscode";
import { TestCase } from "../models/testcase";
import Logger from "../Utils/Logger";
import { MicrosoftProviderId, MicrosoftScopes } from "../Utils/Constants";
import { WebApi } from "azure-devops-node-api";
import { getDevKitTestItems, getLeafTestItems } from "../Utils/testItemHelpers";
import { request } from "http";
import { WorkItemRequestBuilder } from "../Utils/workItemRequestBuilder";

export async function syncTestCase(item: TestCase): Promise<void> {
    Logger.show();
    Logger.appendLine(`Syncing test case ${item.testCaseId}`);
    window.showInformationMessage(`Syncing test case ${item.testCaseId}`);
    let testItems = await getDevKitTestItems();
    const testProjects = testItems.filter(tests => tests.parent === undefined);
    const quickPickItems: QuickPickItem[] = testProjects.map(project => ({ label: project.label }));
    const selectedProjectQuickPick = await window.showQuickPick(quickPickItems, { placeHolder: "Select the project which contains the test" });
    Logger.appendLine(`Selected project: ${selectedProjectQuickPick?.label}`);
    let selection = testProjects.find(project => project.label === selectedProjectQuickPick?.label);
    while (selection?.canResolveChildren) {
        const testSuite = testItems.filter(test => test.parent === selection);
        const quickPickItems: QuickPickItem[] = testSuite?.map(test => ({ label: test.label }));
        const selectedTestQuickPick = await window.showQuickPick(quickPickItems, { placeHolder: "Select the path to the test" });
        selection = testSuite.find(test => test.label === selectedTestQuickPick?.label);
    }
    Logger.appendLine(`Selected test: ${selection?.label}`);
    window.showInformationMessage(`Selected test: ${selection?.label}`);
    const organizationUrl = item.parent!.parent!.parent!.parent!.parent!.organizationUrl;
    const projectName = item.parent!.parent!.parent!.parent!.label;

    const requestBuilder = new WorkItemRequestBuilder(selection!);
    requestBuilder.addSystemTitle();
    requestBuilder.addAutomatedTestName();
    requestBuilder.addAutomatedTestType();
    requestBuilder.addAutomatedTestId();
    await requestBuilder.addAutomatedTestStorage();
    const requestBody = requestBuilder.build();

    const client = await getAzureDevopsClient(organizationUrl);
    const workItemTrackingApi = await client.getWorkItemTrackingApi();
    const workitem = await workItemTrackingApi.updateWorkItem({}, requestBody, item.testCaseId!, projectName);
    Logger.appendLine(`Work item updated: ${workitem.id}`);
}

async function getAzureDevopsClient(organizationUrl: string): Promise<WebApi> {
    const session = await authentication.getSession(MicrosoftProviderId, MicrosoftScopes, { createIfNone: true });
    return WebApi.createWithBearerToken(organizationUrl, session!.accessToken);
}