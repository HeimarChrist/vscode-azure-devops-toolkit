import { EventEmitter, Event, TreeDataProvider, TreeItem, TreeItemCollapsibleState, ProviderResult, workspace, authentication } from "vscode";
import { WebApi } from "azure-devops-node-api";
import Logger from "../Utils/Logger";
import { EXTENSION_NAME, MicrosoftProviderId, MicrosoftScopes } from "../Utils/Constants";
import { Organization } from "../models/organization";
import { Project } from "../models/project";
import { ProjectSection } from "../models/projectSection";
import { TestPlan } from "../models/testplan";
import { TestSuite } from "../models/testsuite";
import { TestCase } from "../models/testcase";
import { Repository } from "../models/repository";
import { PullRequest } from "../models/pullRequest";
import { Pipeline } from "../models/pipeline";
import { PipelineBuild } from "../models/pipelineBuild";
import { Sprint } from "../models/sprint";
import { WorkItem } from "../models/workitem";

const AzureDevopsOverviewPath = "Overview";
const AzureDevopsBoardPath = "Boards";
const AzureDevopsReposPath = "Repos";
const AzureDevopsPipelinesPath = "Pipelines";
const AzureDevopsTestPlansPath = "Test Plans";
const OrganizationNameRegex = /https:\/\/dev\.azure\.com\/([^\/]+)/;

export class AzureDevopsProvider implements TreeDataProvider<TreeItem> {

	private _onDidChangeTreeData: EventEmitter<TreeItem | undefined | void> = new EventEmitter<TreeItem | undefined | void>();
	readonly onDidChangeTreeData: Event<TreeItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor() {
	}

	getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
		return element;
	}

	getChildren(element?: TreeItem | undefined): ProviderResult<TreeItem[]> {

		if (element instanceof Sprint) {
			return this.GetSprintWorkItems(element);
		}
		if (element instanceof TestSuite) {
			return this.GetTestCases(element);
		}
		if (element instanceof TestPlan) {
			return this.GetTestSuites(element);
		}
		if (element instanceof Pipeline) {
			return this.GetPipelineBuilds(element);
		}
		if (element instanceof Repository) {
			return this.GetPullRequests(element);
		}
		if (element instanceof ProjectSection) {
			switch (element.label) {
				case AzureDevopsOverviewPath: {
					return [new TreeItem('Wiki', TreeItemCollapsibleState.None)];
				}
				case AzureDevopsBoardPath: {
					return this.GetSprints(element);
				}
				case AzureDevopsReposPath: {
					return this.GetRepositories(element);
				}
				case AzureDevopsPipelinesPath: {
					return this.GetPipelines(element);
				}
				case AzureDevopsTestPlansPath: {
					return this.GetTestPlans(element);
				}
			}
		}
		if (element instanceof Project) {
			return [
				//new ProjectSection(AzureDevopsOverviewPath, element.client, TreeItemCollapsibleState.Collapsed, element),
				new ProjectSection(AzureDevopsBoardPath, TreeItemCollapsibleState.Collapsed, element),
				new ProjectSection(AzureDevopsReposPath, TreeItemCollapsibleState.Collapsed, element),
				new ProjectSection(AzureDevopsPipelinesPath, TreeItemCollapsibleState.Collapsed, element),
				new ProjectSection(AzureDevopsTestPlansPath, TreeItemCollapsibleState.Collapsed, element)
			];
		}
		if (element instanceof Organization) {
			return this.GetProjects(element);
		}
		if (element === undefined) {
			const configOrganizations = workspace.getConfiguration(EXTENSION_NAME).get('organizations', []) as string[];
			return Promise.all(configOrganizations.map(async (org) => {
				const match = org.match(OrganizationNameRegex);
				Logger.info(`Found organization: ${match![1]}`);
				return new Organization(match![1], org, TreeItemCollapsibleState.Collapsed);
			}));
		} else {
			Logger.warn(`Unexpected element type: ${element.constructor.name}`);
			return [];
		}
	}

	refresh(element: TreeItem): void {
		this._onDidChangeTreeData.fire(element);
	}

	//#region Base Azure DevOps API

	private async getAzureDevopsClient(organizationUrl: string): Promise<WebApi> {
		const session = await authentication.getSession(MicrosoftProviderId, MicrosoftScopes, { createIfNone: true });
		return WebApi.createWithBearerToken(organizationUrl, session!.accessToken);
	}

	private async GetProjects(element: Organization): Promise<Project[]> {
		const organizationUrl = element.organizationUrl;
		const client = await this.getAzureDevopsClient(organizationUrl);
		const coreApi = await client.getCoreApi();
		let projects = await coreApi.getProjects();
		Logger.info(`Found ${projects.length} projects in ${element.label}`);
		const excludeProjects = workspace.getConfiguration(EXTENSION_NAME).get('excludedProjects', []) as string[];
		projects = projects.filter((project) => !excludeProjects.includes(project.name!));
		return projects.map((project) => new Project(project.name!, TreeItemCollapsibleState.Collapsed, element));
	}

	//#endregion Base Azure DevOps API

	//#region Test Plans

	private async GetTestPlans(element: ProjectSection): Promise<TestPlan[]> {
		var organizationUrl = element.parent!.parent!.organizationUrl;
		var projectName = element.parent!.label;
		const client = await this.getAzureDevopsClient(organizationUrl);
		const testPlansApi = await client.getTestPlanApi();
		let azureTestPlans = await testPlansApi.getTestPlans(projectName);
		if (!azureTestPlans) {
			Logger.info(`No test plans found in ${projectName}`);
			return [];
		}
		let testPlans: TestPlan[] = [];
		testPlans = azureTestPlans.map((plan) => new TestPlan(plan.name!, plan.id!, TreeItemCollapsibleState.Collapsed, element));
		while (azureTestPlans.continuationToken) {
			const nextPlans = await testPlansApi.getTestPlans(projectName, undefined, azureTestPlans.continuationToken);
			const nextTestPlans = nextPlans.map((plan) => new TestPlan(plan.name!, plan.id!, TreeItemCollapsibleState.Collapsed, element));
			testPlans = testPlans.concat(nextTestPlans);
		}
		Logger.info(`Found ${testPlans.length} test plans in ${projectName}`);
		return testPlans;
	}

	private async GetTestSuites(element: TestPlan): Promise<TestSuite[]> {
		const organizationUrl = element.parent!.parent!.parent!.organizationUrl;
		const projectName = element.parent!.parent!.label;
		const client = await this.getAzureDevopsClient(organizationUrl);
		const testPlanApi = await client.getTestPlanApi();
		const azureTestSuites = await testPlanApi.getTestSuitesForPlan(projectName, element.testPlanId!);
		if (!azureTestSuites) {
			Logger.info(`No test suites found for ${element.label}`);
			return [];
		}
		let testSuites: TestSuite[] = [];
		testSuites = azureTestSuites.map((suite) => new TestSuite(suite.name!, suite.id!, TreeItemCollapsibleState.Collapsed, element));
		while (azureTestSuites.continuationToken) {
			const nextSuites = await testPlanApi.getTestSuitesForPlan(projectName, element.testPlanId!, undefined, azureTestSuites.continuationToken);
			const nextTestSuites = nextSuites.map((suite) => new TestSuite(suite.name!, suite.id!, TreeItemCollapsibleState.Collapsed, element));
			testSuites = testSuites.concat(nextTestSuites);
		}
		Logger.info(`Found ${testSuites.length} test suites in ${element.label}`);
		return testSuites;
	}

	private async GetTestCases(element: TestSuite): Promise<TestCase[]> {
		const organizationUrl = element.parent!.parent!.parent!.parent!.organizationUrl;
		const projectName = element.parent!.parent!.parent!.label;
		const testPlanId = element.parent!.testPlanId;
		const testSuiteId = element.testSuiteId;
		const client = await this.getAzureDevopsClient(organizationUrl);
		const testPlanApi = await client.getTestPlanApi();
		const testCases = await testPlanApi.getTestCaseList(projectName, testPlanId, testSuiteId);
		if (!testCases) {
			Logger.info(`No test cases found for ${element.label}`);
			return [];
		}
		let azureTestCases: TestCase[] = [];
		azureTestCases = testCases.map((testCase) => new TestCase(
			testCase.workItem?.name!,
			`${client.serverUrl}/${projectName}/_workitems/edit/${testCase.workItem?.id}`,
			testCase.workItem?.id!,
			TreeItemCollapsibleState.None,
			element,
			testCase.workItem?.workItemFields));
			
		while (testCases.continuationToken) {
			const nextCases = await testPlanApi.getTestCaseList(projectName, testPlanId, testSuiteId, testCases.continuationToken);
			var nextTestCases = nextCases.map((testCase) => new TestCase(testCase.workItem?.name!, `${client.serverUrl}/${projectName}/_workitems/edit/${testCase.workItem?.id}`, testCase.workItem?.id!, TreeItemCollapsibleState.None, element));
			azureTestCases = azureTestCases.concat(nextTestCases);
		}
		Logger.info(`Found ${testCases.length} test cases in ${testSuiteId}`);
		return azureTestCases;
	}

	//#endregion Test Plans

	//#region Repository

	private async GetRepositories(element: ProjectSection): Promise<Repository[]> {
		const organizationUrl = element.parent!.parent!.organizationUrl;
		const projectName = element.parent!.label;
		const client = await this.getAzureDevopsClient(organizationUrl);
		const gitApi = await client.getGitApi();
		const azureRepos = await gitApi.getRepositories(projectName);
		if (!azureRepos) {
			Logger.info(`No repositories found in ${projectName}`);
			return [];
		}
		Logger.info(`Found ${azureRepos.length} repositories in ${projectName}`);
		return azureRepos.map((repo) => new Repository(repo.name!, repo.id!, repo.webUrl!, TreeItemCollapsibleState.Collapsed, element));
	}

	private async GetPullRequests(element: Repository): Promise<PullRequest[]> {
		const organizationUrl = element.parent!.parent!.parent!.organizationUrl;
		const projectName = element.parent!.parent!.label;
		const client = await this.getAzureDevopsClient(organizationUrl);
		const gitApi = await client.getGitApi();
		const pullRequests = await gitApi.getPullRequestsByProject(projectName, { repositoryId: element.repoId });
		if (!pullRequests) {
			Logger.info(`No pull requests found in ${element.label}`);
			return [];
		}
		Logger.info(`Found ${pullRequests.length} pull requests in ${element.label}`);
		return pullRequests.map((pr) => new PullRequest(pr.title!, pr.pullRequestId!, `${element.webUrl}/pullrequest/${pr.pullRequestId}`, TreeItemCollapsibleState.None, element));
	}

	//#endregion Repository

	//#region Pipelines

	private async GetPipelines(element: ProjectSection): Promise<Pipeline[]> {
		const organizationUrl = element.parent!.parent!.organizationUrl;
		const projectName = element.parent!.label;
		const client = await this.getAzureDevopsClient(organizationUrl);
		const pipelineApi = await client.getPipelinesApi();
		const pipelines = await pipelineApi.listPipelines(projectName);
		if (!pipelines) {
			Logger.info(`No pipelines found in ${projectName}`);
			return [];
		}
		return pipelines.map((pipeline) => new Pipeline(pipeline.name!, TreeItemCollapsibleState.Collapsed, element));
	}

	private async GetPipelineBuilds(element: Pipeline, countFilter: number = 5): Promise<PipelineBuild[]> {
		const organizationUrl = element.parent!.parent!.parent!.organizationUrl;
		const projectName = element.parent!.parent!.label;
		const client = await this.getAzureDevopsClient(organizationUrl);
		const pipelineApi = await client.getBuildApi();
		const azureBuilds = await pipelineApi.getBuilds(projectName, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, countFilter);
		if (!azureBuilds) {
			Logger.info(`No builds found for ${element.label}`);
			return [];
		}
		let builds: PipelineBuild[] = [];
		builds = azureBuilds.map((build) => new PipelineBuild(build.buildNumber!, build.result!, TreeItemCollapsibleState.None, element));
		while (azureBuilds.continuationToken) {
			const next = await pipelineApi.getBuilds(projectName, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, countFilter, azureBuilds.continuationToken);
			const nextBuilds = next.map((build) => new PipelineBuild(build.buildNumber!, build.result!, TreeItemCollapsibleState.None, element));
			builds = builds.concat(nextBuilds);
		}
		Logger.info(`Found ${builds.length} builds for ${element.label}`);
		return builds;
	}

	//#endregion Pipelines

	//#region Boards

	private async GetSprints(element: ProjectSection): Promise<Sprint[]> {
		const organizationUrl = element.parent!.parent!.organizationUrl;
		const projectName = element.parent!.label;
		const client = await this.getAzureDevopsClient(organizationUrl);
		const coreApi = await client.getCoreApi();
		const workApi = await client.getWorkApi();
		const teams = await coreApi.getTeams(projectName);
		let sprints: Sprint[] = [];
		for (const t of teams) {
			const iteration = await workApi.getTeamIterations({ projectId: projectName, teamId: t.id }, 'current');
			if (!iteration) {
				Logger.info(`No sprints found for ${t.name}`);
				continue;
			}
			sprints.push(...iteration.map((s) => new Sprint(`${s.name!} - ${t.name}`, s.id!, t.id!, s.url!, TreeItemCollapsibleState.Collapsed, element)));
		}
		return sprints;
	}

	private async GetSprintWorkItems(element: Sprint): Promise<TreeItem[]> {
		const organizationUrl = element.parent!.parent!.parent!.organizationUrl;
		const projectName = element.parent!.parent!.label;
		const client = await this.getAzureDevopsClient(organizationUrl);
		const workApi = await client.getWorkApi();
		const workItems = await workApi.getIterationWorkItems({ projectId: projectName, teamId: element.teamId }, element.sprintId.toString());
		if (!workItems || workItems.workItemRelations?.length === 0) {
			Logger.info(`No work items found for ${element.label}`);
			return [];
		}
		const workItemsIds: number[] = workItems.workItemRelations?.map((wi) => wi.target!.id!) || [];
		const getWorkItemTrackingApi = await client.getWorkItemTrackingApi();
		let workItemsDetails = await getWorkItemTrackingApi.getWorkItemsBatch({ ids: workItemsIds, fields: ['System.Title', 'System.WorkItemType', 'System.AssignedTo'] }, projectName);
		workItemsDetails = workItemsDetails.filter((wi) => wi.fields!["System.WorkItemType"] !== 'Task');
		return workItemsDetails.map((wi) => {
			const assignedTo = wi.fields!['System.AssignedTo'] ? wi.fields!['System.AssignedTo'].displayName : "Unassigned";
			return new WorkItem(`${wi.id} - ${wi.fields!["System.Title"]} - ${assignedTo}`, wi.id!, `${client.serverUrl}/${projectName}/_workitems/edit/${wi.id!}`, wi.fields!["System.WorkItemType"], TreeItemCollapsibleState.None, element);
		});
	}

	//#endregion Boards

}