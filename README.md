# ProTrack 3

An Electron-based desktop application for Project Management, built with React 19 and TypeScript. ProTrack 3 helps you manage projects, tasks, and team members with a focus on local data persistence and a clean, responsive interface.

## Features

- **Project Management**: Create and track multiple projects with custom prefixes, start dates, and due dates.
- **Task Management**: Comprehensive task tracking with descriptions, assignees, and statuses.
- **Task Hierarchy**: Organize work by nesting tasks within one another.
- **Dependency Tracking**: Manage task prerequisites and track what tasks are blocked by others.
- **People & Team Management**: Maintain a directory of team members with custom profile colors for easy identification.
- **Customizable Statuses**: Define your own workflow with custom statuses and identify which ones represent "New" or "Complete" states.
- **Local Persistence**: All data is stored locally in a SQLite database, ensuring privacy and offline availability.
- **Modern UI**: A polished interface built with Bootstrap 5 and FontAwesome.

## Tech Stack

- **Framework**: [Electron](https://www.electronjs.org/) (via [Electron Forge](https://www.electronforge.io/))
- **Frontend**: [React 19](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **Routing**: [React Router 7](https://reactrouter.com/)
- **Database**: [SQLite](https://www.sqlite.org/) (via `sqlite` & `sqlite3`)
- **Styling**: [Bootstrap 5](https://getbootstrap.com/) + Custom CSS
- **Icons**: [FontAwesome 7](https://fontawesome.com/)
- **Build Tool**: Webpack

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- npm (comes with Node.js)

### Installation

```bash
npm install
```

### Running the Application (Development)

```bash
npm start
```

### Packaging for Distribution

```bash
npm run package
# or
npm run make
```

## Project Structure

```text
.
├── migrations/         # SQLite database migration files
├── src/
│   ├── main/           # Main process logic (Node.js environment)
│   │   ├── database.ts # Database initialization and migration logic
│   │   ├── index.ts    # Main process entry point & IPC handlers
│   │   └── preload.ts  # Preload script for IPC and secure bridge
│   └── renderer/       # Renderer process (React environment)
│       ├── App.tsx     # Main React component & Routing
│       ├── components/ # Modular UI components
│       ├── types.ts    # Shared TypeScript interfaces
│       └── renderer.tsx # Renderer entry point (React mount)
├── forge.config.ts     # Electron Forge configuration
├── tsconfig.json       # TypeScript configuration
└── webpack.config.*    # Webpack configurations
```

## Architecture

ProTrack 3 follows Electron's best practices for security and performance. For a detailed breakdown of the system design, database schema, and IPC communication, see [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## License

MIT
