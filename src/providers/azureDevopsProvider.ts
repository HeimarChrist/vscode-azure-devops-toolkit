import { Command, EventEmitter, Event, TreeDataProvider, TreeItem, TreeItemCollapsibleState, ProviderResult, workspace, Uri, AuthenticationSession, ThemeIcon } from "vscode";
import { WebApi } from "azure-devops-node-api";
import Logger from "../Utils/Logger";
import { EXTENSION_NAME } from "../Utils/Constants";
import { PullRequestStatus } from "azure-devops-node-api/interfaces/GitInterfaces";
import { BuildResult, BuildStatus } from "azure-devops-node-api/interfaces/BuildInterfaces";

const AzureDevopsOverviewPath = "Overview";
const AzureDevopsBoardPath = "Boards";
const AzureDevopsReposPath = "Repos";
const AzureDevopsPipelinesPath = "Pipelines";
const AzureDevopsTestPlansPath = "Test Plans";
const OrganizationNameRegex = /https:\/\/dev\.azure\.com\/([^\/]+)/;

export class AzureDevopsProvider implements TreeDataProvider<TreeItem> {

	private _onDidChangeTreeData: EventEmitter<TreeItem | undefined | void> = new EventEmitter<TreeItem | undefined | void>();
	readonly onDidChangeTreeData: Event<TreeItem | undefined | void> = this._onDidChangeTreeData.event;

	private Session: AuthenticationSession;
	private azureClient: WebApi | undefined;

	constructor(session: AuthenticationSession) {
		this.Session = session;
	}

	getTreeItem(element: TreeItem): TreeItem | Thenable<TreeItem> {
		return element;
	}

	getChildren(element?: TreeItem | undefined): ProviderResult<TreeItem[]> {

		if (element instanceof Pipelines) {
			const projectName = element.parent!.parent!.label;
			const pipelines = element.client.getBuildApi().then((api) => api.getBuilds(projectName, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 5));
			return pipelines.then((builds) => {
				Logger.info(`Found ${builds.length} pipelines`);
				return builds.map((build) => new PipelineBuild(build.buildNumber!, element.client, build.result!, TreeItemCollapsibleState.None, element));
			});
		}
		if (element instanceof Repos) {
			const projectName = element.parent!.parent!.label;
			const pullRequests = element.client.getGitApi().then((api) => api.getPullRequestsByProject(projectName, { repositoryId: element.repoId }));
			return pullRequests.then((prs) => {
				Logger.info(`Found ${prs.length} pull requests in ${element.label}`);
				return prs.map((pr) => new PullRequests(pr.title!, element.client, TreeItemCollapsibleState.None, element,
					{
						command: 'vscode.open',
						title: 'Open',
						arguments: [Uri.parse(`${element.webUrl!}/pullrequest/${pr.pullRequestId}`, true)]
					}));
			});
		}
		if (element instanceof ProjectSection) {
			const projectName = element.parent!.label;
			switch (element.label) {
				case AzureDevopsOverviewPath: {
					return [new TreeItem('Wiki', TreeItemCollapsibleState.None)];
				}
				case AzureDevopsBoardPath: {
					return [
						new TreeItem('Work Items', TreeItemCollapsibleState.None),
						new TreeItem('Sprint (Current)', TreeItemCollapsibleState.None)
					];
				}
				case AzureDevopsReposPath: {
					const repositories = element.client.getGitApi().then((api) => api.getRepositories(projectName));
					return repositories.then((repos) => {
						Logger.info(`Found ${repos.length} repositories`);
						return repos.map((repo) => new Repos(repo.name!, element.client, repo.id!, repo.url!, repo.webUrl!, TreeItemCollapsibleState.Collapsed, element));
					});
				}
				case AzureDevopsPipelinesPath: {
					const pipelines = element.client.getPipelinesApi().then((api) => api.listPipelines(projectName));
					return pipelines.then((builds) => {
						Logger.info(`Found ${builds.length} pipelines`);
						return builds.map((build) => new Pipelines(build.name!, element.client, TreeItemCollapsibleState.Collapsed, element));
					});
				}
				case AzureDevopsTestPlansPath: {
					return [new TreeItem('Test Plans', TreeItemCollapsibleState.None)];
				}
			}
		}
		if (element instanceof Project) {
			return [
				//new ProjectSection(AzureDevopsOverviewPath, element.client, TreeItemCollapsibleState.Collapsed, element),
				//new ProjectSection(AzureDevopsBoardPath, element.client, TreeItemCollapsibleState.Collapsed, element),
				new ProjectSection(AzureDevopsReposPath, element.client, TreeItemCollapsibleState.Collapsed, element),
				new ProjectSection(AzureDevopsPipelinesPath, element.client, TreeItemCollapsibleState.Collapsed, element),
				new ProjectSection(AzureDevopsTestPlansPath, element.client, TreeItemCollapsibleState.Collapsed, element)
			];
		}
		if (element instanceof Organization) {

			const coreApi = element.client.getCoreApi();
			const projectCollection = coreApi.then((api) => api.getProjects());
			return projectCollection.then((projects) => {
				Logger.info(`Found ${projects.length} projects in ${element.label}`);
				return projects.map((project) => new Project(project.name!, element.client, TreeItemCollapsibleState.Collapsed));
			});
		}
		if (element === undefined) {
			const configOrganizations = workspace.getConfiguration(EXTENSION_NAME).get('organizations', []) as string[];
			Logger.info(`Found ${configOrganizations.length} configured organizations`);
			return configOrganizations.map((org) => {
				const client = this.getAzureClient(org);
				const match = org.match(OrganizationNameRegex);
				return new Organization(match![1], org, client, TreeItemCollapsibleState.Collapsed);
			});
		} else {
			Logger.warn(`Unexpected element type: ${element.constructor.name}`);
			return [];
		}
	}

	refresh(element: TreeItem): void {
		this._onDidChangeTreeData.fire(element);
	}

	private getAzureClient(organizationUrl: string): WebApi {
		if (this.azureClient === undefined) {
			this.azureClient = WebApi.createWithBearerToken(organizationUrl, this.Session.accessToken);
		}
		return this.azureClient;
	}
}

class Organization extends TreeItem {

	constructor(
		public readonly label: string,
		public readonly tooltip: string,
		public readonly client: WebApi,
		public readonly collapsibleState: TreeItemCollapsibleState,
		public readonly command?: Command
	) {
		super(label, collapsibleState);
		this.tooltip = tooltip;
		this.iconPath = new ThemeIcon('organization');
	}

	contextValue = 'organization';
}

class Project extends TreeItem {

	constructor(
		public readonly label: string,
		public readonly client: WebApi,
		public readonly collapsibleState: TreeItemCollapsibleState,
		public readonly parent?: Organization,
		public readonly command?: Command
	) {
		super(label, collapsibleState);
		this.tooltip = `${this.label}`;
		this.iconPath = new ThemeIcon('project');
	}

	contextValue = 'project';
}

class ProjectSection extends TreeItem {

	constructor(
		public readonly label: string,
		public readonly client: WebApi,
		public readonly collapsibleState: TreeItemCollapsibleState,
		public readonly parent?: Project
	) {
		super(label, collapsibleState);
	}
}

export class Repos extends TreeItem {

	constructor(
		public readonly label: string,
		public readonly client: WebApi,
		public readonly repoId: string,
		public readonly repoUrl: string,
		public readonly webUrl: string,
		public readonly collapsibleState: TreeItemCollapsibleState,
		public readonly parent?: ProjectSection,
		public readonly command?: Command
	) {
		super(label, collapsibleState);
		this.tooltip = `${this.label}`;
		this.iconPath = new ThemeIcon('repo');
	}

	contextValue = 'repos';
}

class PullRequests extends TreeItem {

	constructor(
		public readonly label: string,
		public readonly client: WebApi,
		public readonly collapsibleState: TreeItemCollapsibleState,
		public readonly parent?: Repos,
		public readonly command?: Command
	) {
		super(label, collapsibleState);
		this.iconPath = new ThemeIcon('git-pull-request');
	}
	contextValue = 'pullRequests';
}

class Pipelines extends TreeItem {

	constructor(
		public readonly label: string,
		public readonly client: WebApi,
		public readonly collapsibleState: TreeItemCollapsibleState,
		public readonly parent?: ProjectSection,
		public readonly command?: Command
	) {
		super(label, collapsibleState);
		this.iconPath = new ThemeIcon('github-action');
	}
	contextValue = 'pipelines';
}

class PipelineBuild extends TreeItem {

	constructor(
		public readonly label: string,
		public readonly client: WebApi,
		public readonly status: BuildResult,
		public readonly collapsibleState: TreeItemCollapsibleState,
		public readonly parent?: Pipelines,
		public readonly command?: Command
	) {
		super(label, collapsibleState);
		this.iconPath = new ThemeIcon('build');
		switch (status) {
			case BuildResult.Canceled:
				this.iconPath = new ThemeIcon('circle-slash');
				break;
			case BuildResult.Failed:
				this.iconPath = new ThemeIcon('testing-error-icon');
				break;
			case BuildResult.PartiallySucceeded:
				this.iconPath = new ThemeIcon('warning');
				break;
			case BuildResult.Succeeded:
				this.iconPath = new ThemeIcon('testing-passed-icon');
				break;
		}
	}
}