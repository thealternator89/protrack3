# Architecture Overview

ProTrack 3 is an Electron-based application that separates its logic into a secure main process (Node.js) and a modern renderer process (React).

## Process Model

- **Main Process (`src/main/`):**
  - **Entry Point (`index.ts`):** Manages application lifecycle and initializes core systems.
  - **Repositories (`src/main/repositories/`):** Encapsulates data access logic using the Repository Pattern. Each domain (Project, Task, Person, etc.) has its own repository for database operations.
  - **Services (`src/main/services/`):** Contains complex business logic and external integrations, such as `AzureDevOpsService`.
  - **IPC Handlers (`src/main/ipc/`):** Modular registration of IPC handlers, organized by domain, ensuring a clean and manageable `index.ts`.
  - **Database (`src/main/database.ts`):** Owns the SQLite database connection and migration logic.
  - **Window Management (`src/main/window.ts`):** Logic for creating and configuring the browser window.
- **Preload Script (`src/main/preload.ts`):**
  - Acts as a secure, typed bridge between processes.
  - Exposes APIs to the renderer using `contextBridge.exposeInMainWorld`.
- **Renderer Process (`src/renderer/`):**
  - A modern React 19 application.
  - Utilizes React Router 7 for navigation.
  - Components located in `src/renderer/components/` handle various views: `ProjectList`, `ProjectView`, `TaskView`, and `Settings`.

## Core Patterns

### Repository Pattern
The application employs a Repository Pattern to decouple the data access layer from the business logic and IPC handlers. This provides:
- **Centralized Queries**: Database queries are stored in one place, making them easier to maintain and optimize.
- **Consistency**: Standardized data retrieval and modification across the application.

### Service Layer
Complex workflows or external integrations (like Azure DevOps import) are encapsulated in Services. This ensures that IPC handlers remain thin and focused on communication, while business logic resides in a dedicated layer.

### Shared UI Components
The renderer process leverages a shared component library in `src/renderer/components/shared/` to:
- **Minimize Duplication**: Standardized components for Modals and Loading Spinners reduce boilerplate.
- **Generic Entity Modals**: Common form logic for creating and editing projects (`ProjectModal`) and tasks (`TaskModal`) is encapsulated, ensuring a consistent user experience.

## Data Persistence & Schema

The application uses **SQLite** for all persistent storage. The database is initialized and migrated automatically on startup.

### Database Schema

- **Project**: Tracks high-level project metadata (Title, Prefix, StartDate, DueDate, Owner).
- **Task**: Main unit of work. Includes hierarchical relationships (`ParentId`), sort order, assignees, and statuses.
- **Person**: Directory of team members/assignees with custom display colors.
- **Status**: Custom workflow statuses, including flags for "New" and "Complete".
- **TaskSource**: Configuration for external task integrations (e.g., Jira, GitHub).
- **TaskPrerequisite**: Many-to-many relationship tracking task dependencies.
- **StatusMap**: Mapping external source statuses to internal application statuses.

### Automated Migrations

Schema changes are managed through SQL migration files in the `migrations/` directory. On application startup, `initDatabase()` (in `src/main/database.ts`) detects and applies any pending migrations.

## Inter-Process Communication (IPC)

The renderer communicates with the main process exclusively through asynchronous IPC calls. IPC handlers are modularized in `src/main/ipc/` and registered during the app's `ready` event.

- **Modular Handlers**: Each domain (Projects, Tasks, People, Statuses, TaskSources) has its own registration module.
- **Database Handlers**: Direct query/run access is available via `src/main/ipc/database.ts` for simple needs.
- **External Handlers**: Native OS features like opening external links are managed in `src/main/ipc/external.ts`.

Example usage in React:
```typescript
// Defined in preload.ts and available on the window object
const result = await window.projects.get(projectId);
```

## Development Workflow

- **Type Safety**: TypeScript is used end-to-end. Common interfaces used by both processes are located in `src/shared/types.ts`, while renderer-specific API definitions are in `src/renderer/types.ts`.
- **UI Framework**: Bootstrap 5 provides a responsive grid and pre-built components, supplemented by custom CSS in `src/renderer/index.css`.
- **Icons**: FontAwesome 7 icons are used consistently across the UI.
- **Styling**: Vanilla CSS is used for specific component layouts and custom branding.
