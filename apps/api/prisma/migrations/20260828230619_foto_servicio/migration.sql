-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_services" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL,
    "duration_minutes" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "image_url" TEXT,
    "image_focal_x" INTEGER NOT NULL DEFAULT 50,
    "image_focal_y" INTEGER NOT NULL DEFAULT 50,
    "image_scale" INTEGER NOT NULL DEFAULT 100,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_services" ("created_at", "description", "duration_minutes", "id", "is_active", "name", "price", "sort_order", "updated_at") SELECT "created_at", "description", "duration_minutes", "id", "is_active", "name", "price", "sort_order", "updated_at" FROM "services";
DROP TABLE "services";
ALTER TABLE "new_services" RENAME TO "services";
CREATE UNIQUE INDEX "services_name_key" ON "services"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
