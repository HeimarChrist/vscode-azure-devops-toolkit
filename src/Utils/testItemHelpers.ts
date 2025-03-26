import { extensions, FileSystemWatcher, TestItem, window } from "vscode";


export async function getDevKitTestItems(): Promise<Array<TestItem>> {
    const extension = extensions.getExtension("ms-dotnettools.csdevkit");
    if (!extension?.isActive) {
        window.showErrorMessage("The C# extension is not active. Please activate the C# extension and try again.");
        return [];
    }
    const apiController = await extension.exports.testHooks.getTestController();
    const testItemsMap: Map<number, TestItem> = apiController._testViewManager.testItems;
    const testItems: TestItem[] = Array.from(testItemsMap.values())
    return testItems;
}

export async function getLeafTestItems(testItem: TestItem): Promise<Array<TestItem>> {
    let leafTestCases = new Array<TestItem>();
    async function getTestCasesRecursive(testItem: TestItem) {
        if (!testItem.canResolveChildren) {
            leafTestCases.push(testItem);
        }
        else {
            testItem.children.forEach(async child => {
                await getTestCasesRecursive(child);
            });
        }
    }
    await getTestCasesRecursive(testItem);
    return leafTestCases;
}

export async function getTestAssemblyName(testItem: TestItem): Promise<string> {
    while (testItem.parent !== undefined) {
        testItem = testItem.parent;
    }
    const extension = extensions.getExtension("ms-dotnettools.csdevkit");
    if (!extension?.isActive) {
        window.showErrorMessage("The C# extension is not active. Please activate the C# extension and try again.");
        throw new Error("The C# extension is not active. Please activate the C# extension and try again.");
    }
    const apiController = await extension.exports.testHooks.getTestController();
    const watchedFiles: Map<string, FileSystemWatcher> = apiController.watchers;
    const watchedFilesKeys = Array.from(watchedFiles.keys());
    // Step 1: Find the shortest path
    let commonPrefix = "";
    const splitPaths = watchedFilesKeys.map(filepath => filepath.split('/'));
    const shortestPathSegments = splitPaths.reduce((a, b) => a.length <= b.length ? a : b);
    // Step 2: Find the common prefix of all items
    for (let i = 0; i < shortestPathSegments.length; i++) {
        const segment = shortestPathSegments[i];
        if (splitPaths.every(pathSegments => pathSegments[i] === segment)) {
            commonPrefix += segment + '/';
        } else {
            break;
        }
    }
    // Step 3: Remove the common prefix from each item
    const projectFilePathArray = watchedFilesKeys.map(item => item.slice(commonPrefix.length));
    const testDllPath = projectFilePathArray.find(item => item.startsWith(testItem.label.split(" ")[0])) ?? "";
    const testDll = testDllPath.split("/").pop() ?? "";
    return testDll;
}

export function getTestAssemblyPath(testItem: TestItem): string {
    let testAssemblyPath = testItem.label;
    let currentItem: TestItem = testItem;
    while (currentItem.parent?.parent !== undefined) {
        if (currentItem.label.split("(")[0] !== currentItem.parent.label) {
            testAssemblyPath = currentItem.parent.label + "." + testAssemblyPath;
        }
        currentItem = currentItem.parent;
    }
    return testAssemblyPath;
}

export function getReadableTestName(testLabel: string): string {
    let testLabelName = testLabel;
    testLabel.normalize();
    let testParameters = "";
    if (testLabel.includes("(")) {
        testLabelName = testLabel.substring(0, testLabel.indexOf("("));
        testParameters = testLabel.substring(testLabel.indexOf("("));
    }
    testLabelName = testLabelName.replaceAll("_", "");
    return testLabelName
        .replace(/(?<=[A-Z])(?=[A-Z][a-z])|(?<=[^A-Z])(?=[A-Z])|(?<=[A-Za-z])(?=[^A-Za-z])/g, " ")
        .concat(" ", testParameters)
        .trim();
}