import { TestItem } from "vscode";
import { JsonPatchDocument } from "azure-devops-node-api/interfaces/common/VSSInterfaces";
import { randomUUID } from "crypto";
import { getReadableTestName, getTestAssemblyName, getTestAssemblyPath } from "./testItemHelpers";

export class WorkItemRequestBuilder {
    private _testItem: TestItem;
    private bodyList: JsonPatchDocument[] = [];

    constructor(testItem: TestItem) {
        this._testItem = testItem;
    }

    build(): JsonPatchDocument {
        return this.bodyList;
    }

    addSystemTitle(): WorkItemRequestBuilder {
        this.bodyList.push({
            op: "add",
            path: "/fields/System.Title",
            value: getReadableTestName(this._testItem.label)
        });
        return this;
    }

    addAutomatedTestName(): WorkItemRequestBuilder {
        this.bodyList.push({
            op: "add",
            path: "/fields/Microsoft.VSTS.TCM.AutomatedTestName",
            value: getTestAssemblyPath(this._testItem)
        });
        return this;
    }

    async addAutomatedTestStorage(): Promise<WorkItemRequestBuilder> {
        this.bodyList.push({
            op: "add",
            path: "/fields/Microsoft.VSTS.TCM.AutomatedTestStorage",
            value: await getTestAssemblyName(this._testItem)
        });
        return this;
    }

    addAutomatedTestType(): WorkItemRequestBuilder {
        this.bodyList.push({
            op: "add",
            path: "/fields/Microsoft.VSTS.TCM.AutomatedTestType",
            value: "QA Automated Test"
        });
        return this;
    }

    addAutomatedTestId(): WorkItemRequestBuilder {
        this.bodyList.push({
            op: "add",
            path: "/fields/Microsoft.VSTS.TCM.AutomatedTestId",
            value: randomUUID()
        });
        return this;
    }

}