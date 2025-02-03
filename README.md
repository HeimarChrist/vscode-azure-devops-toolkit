# Azure DevOps Toolkit

The Azure DevOps Toolkit is a Visual Studio Code extension designed to streamline your interaction with Azure DevOps services. This extension provides a suite of tools to help you develop, interact with, and monitor your Azure DevOps projects directly from within Visual Studio Code. Whether you are managing pipelines, repositories, or work items, the Azure DevOps Toolkit aims to enhance your productivity and simplify your workflows.

## Features

- Boards
   - View sprint/kanban board (Future)
   - Open individual board items (Future)
- Repositories
   - Quick clone of source code (Future)
   - List of open pull requests (In progress)
- Pipelines
   - Monitor pipeline runs (Future)
   - Monitor release pipelines (Future)
   - Dashboard (Future)
- Test plan 
   - Manage Test plans (Future)
   - Create Test Suite (Future)
   - Write Test Cases (Future)
   - Sync Automated test cases to test cases (Migration in progress)

## Requirements
TBD

## Getting Started

To get started with the Azure DevOps Toolkit extension, you have two options: download it from the Visual Studio Code Marketplace or build it locally.

### Option 1: Download from Visual Studio Code Marketplace

1. Open Visual Studio Code.
2. Go to the Extensions view by clicking on the Extensions icon in the Activity Bar on the side of the window or by pressing `Ctrl+Shift+X`.
3. Search for "Azure DevOps Toolkit".
4. Click the "Install" button.

### Option 2: Build Locally

Follow the steps below to build the extension locally:

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd my-vscode-extension
   ```

2. **Open in Visual Studio Code**:
   Open the project in Visual Studio Code.

3. **Reopen in Container**:
   Use the command palette (Ctrl+Shift+P) and select `Remote-Containers: Reopen in Container` to start the development environment.

5. **Run the Extension**:
   Press `F5` to launch the extension in a new Extension Development Host window.

## Running Tests

To run the unit tests, use the following command:
```
npm test
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Disclaimer

This project is not affiliated with, endorsed by, or in any way associated with Microsoft.