import { app } from 'electron';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

let db: Database;

export async function initDatabase() {
  try {
    const dbPath = path.join(app.getPath('userData'), 'database.db');
    console.log('Database path:', dbPath);

    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // Enable foreign key support
    await db.run('PRAGMA foreign_keys = ON');

    // Run migrations
    // In development, the migrations folder is in the project root.
    // In production, it will be in process.resourcesPath/migrations.
    let migrationsPath = path.join(process.cwd(), 'migrations');
    
    if (app.isPackaged) {
      migrationsPath = path.join(process.resourcesPath, 'migrations');
    }

    console.log('Migrations path:', migrationsPath);

    if (!fs.existsSync(migrationsPath)) {
      console.warn(`Migrations path not found: ${migrationsPath}`);
    } else {
      await db.migrate({
        migrationsPath: migrationsPath
      });
    }

    return db;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function closeDatabase() {
  if (db) {
    await db.close();
  }
}
