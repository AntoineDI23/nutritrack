import * as SQLite from "expo-sqlite";

const DATABASE_NAME = "nutritrack.db";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initPromise: Promise<void> | null = null;

async function openDatabase() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME);
  }

  return dbPromise;
}

export async function initDatabase() {
  if (!initPromise) {
    initPromise = (async () => {
      const db = await openDatabase();

      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS meals (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          date TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS foods (
          row_id TEXT PRIMARY KEY NOT NULL,
          id TEXT NOT NULL,
          meal_id TEXT NOT NULL,
          name TEXT NOT NULL,
          brand TEXT,
          image_url TEXT,
          nutriscore TEXT,
          calories REAL DEFAULT 0,
          proteins REAL DEFAULT 0,
          carbs REAL DEFAULT 0,
          fats REAL DEFAULT 0,
          FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_meals_date ON meals(date);
        CREATE INDEX IF NOT EXISTS idx_foods_meal_id ON foods(meal_id);
      `);
    })();
  }

  return initPromise;
}

export async function getDatabase() {
  await initDatabase();
  return openDatabase();
}