-- Up
CREATE TABLE Person (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Email TEXT NOT NULL,
    Color TEXT
);

CREATE TABLE "Type" (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Label TEXT NOT NULL,
    Color TEXT NOT NULL,
    Icon TEXT NOT NULL
);

CREATE TABLE Status (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Label TEXT NOT NULL,
    IsComplete INTEGER NOT NULL CHECK (IsComplete IN (0, 1))
);

CREATE TABLE TaskSource (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Type TEXT NOT NULL,
    Config TEXT NOT NULL
);

CREATE TABLE Project (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Title TEXT NOT NULL,
    StartDate TEXT,
    DueDate TEXT,
    OwnerId INTEGER,
    TaskSourceId INTEGER,
    FOREIGN KEY (OwnerId) REFERENCES Person(Id),
    FOREIGN KEY (TaskSourceId) REFERENCES TaskSource(Id)
);

CREATE TABLE Task (
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Title TEXT NOT NULL,
    Description TEXT,
    ProjectId INTEGER NOT NULL,
    AssigneeId INTEGER,
    StatusId INTEGER,
    TypeId INTEGER,
    ParentId INTEGER,
    RemoteTaskId INTEGER,
    FOREIGN KEY (ProjectId) REFERENCES Project(Id),
    FOREIGN KEY (AssigneeId) REFERENCES Person(Id),
    FOREIGN KEY (StatusId) REFERENCES Status(Id),
    FOREIGN KEY (TypeId) REFERENCES "Type"(Id),
    FOREIGN KEY (ParentId) REFERENCES Task(Id)
);

CREATE TABLE StatusMap (
    TaskSourceId INTEGER NOT NULL,
    StatusId INTEGER NOT NULL,
    SourceName TEXT NOT NULL,
    PRIMARY KEY (TaskSourceId, StatusId),
    FOREIGN KEY (TaskSourceId) REFERENCES TaskSource(Id),
    FOREIGN KEY (StatusId) REFERENCES Status(Id)
);

CREATE TABLE TypeMap (
    TaskSourceId INTEGER NOT NULL,
    TypeId INTEGER NOT NULL,
    SourceName TEXT NOT NULL,
    PRIMARY KEY (TaskSourceId, TypeId),
    FOREIGN KEY (TaskSourceId) REFERENCES TaskSource(Id),
    FOREIGN KEY (TypeId) REFERENCES "Type"(Id)
);

CREATE TABLE TaskPrerequisite (
    TaskId INTEGER NOT NULL,
    PrerequisiteTaskId INTEGER NOT NULL,
    PrerequisiteType TEXT NOT NULL,
    PRIMARY KEY (TaskId, PrerequisiteTaskId),
    FOREIGN KEY (TaskId) REFERENCES Task(Id),
    FOREIGN KEY (PrerequisiteTaskId) REFERENCES Task(Id)
);

-- Down
DROP TABLE TaskPrerequisite;
DROP TABLE TypeMap;
DROP TABLE StatusMap;
DROP TABLE Task;
DROP TABLE Project;
DROP TABLE TaskSource;
DROP TABLE Status;
DROP TABLE "Type";
DROP TABLE Person;
