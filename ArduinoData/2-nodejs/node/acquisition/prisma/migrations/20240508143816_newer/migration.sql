/*
  Warnings:

  - You are about to drop the column `colorOther` on the `Measure` table. All the data in the column will be lost.
  - You are about to drop the column `colorPink` on the `Measure` table. All the data in the column will be lost.
  - You are about to drop the column `colorYellow` on the `Measure` table. All the data in the column will be lost.
  - Added the required column `idContainer` to the `Measure` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Container" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ballColor" TEXT NOT NULL,
    "ballNumber" INTEGER,
    "idSession" INTEGER NOT NULL,
    CONSTRAINT "Container_idSession_fkey" FOREIGN KEY ("idSession") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Measure" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "time" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ballColor" TEXT,
    "idSession" INTEGER NOT NULL,
    "idContainer" INTEGER NOT NULL,
    CONSTRAINT "Measure_idSession_fkey" FOREIGN KEY ("idSession") REFERENCES "Session" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Measure_idContainer_fkey" FOREIGN KEY ("idContainer") REFERENCES "Container" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Measure" ("id", "idSession", "time") SELECT "id", "idSession", "time" FROM "Measure";
DROP TABLE "Measure";
ALTER TABLE "new_Measure" RENAME TO "Measure";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
