# Architecture Overview

ProTrack 3 is an Electron-based application that separates its logic into a secure main process (Node.js) and a modern renderer process (React).

## Process Model

- **Main Process (`src/main/index.ts`):**
  - Manages application lifecycle and native OS interactions.
  - Owns and manages the SQLite database via `src/main/database.ts`.
  - Exposes functionality to the UI through a robust set of IPC handlers.
- **Preload Script (`src/main/preload.ts`):**
  - Acts as a secure, typed bridge between processes.
  - Exposes APIs to the renderer using `contextBridge.exposeInMainWorld`.
- **Renderer Process (`src/renderer/renderer.tsx`):**
  - A modern React 19 application.
  - Utilizes React Router 7 for navigation.
  - Components located in `src/renderer/components/` handle various views: `ProjectList`, `ProjectView`, `TaskView`, and `Settings`.

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

The renderer communicates with the database and OS exclusively through asynchronous IPC calls.

- **DB Access**: Generic `db-query` and `db-run` handlers are available for flexible queries.
- **Entity Handlers**: Specialized handlers (e.g., `create-project`, `get-task`, `update-person`) encapsulate complex logic or frequently used operations.
- **Task Operations**: Advanced handlers for task hierarchy, prerequisites, and bulk sort order updates.

Example usage in React:
```typescript
// Defined in preload.ts and available on window.electronAPI
const result = await window.electronAPI.getProject(projectId);
```

## Development Workflow

- **Type Safety**: TypeScript is used end-to-end. Shared types are located in `src/renderer/types.ts`.
- **UI Framework**: Bootstrap 5 provides a responsive grid and pre-built components, supplemented by custom CSS in `src/renderer/index.css`.
- **Icons**: FontAwesome 7 icons are used consistently across the UI.
- **Styling**: Vanilla CSS is used for specific component layouts and custom branding.
