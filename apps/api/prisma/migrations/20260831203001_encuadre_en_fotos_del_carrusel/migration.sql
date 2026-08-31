-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_service_images" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "service_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "image_focal_x" INTEGER NOT NULL DEFAULT 50,
    "image_focal_y" INTEGER NOT NULL DEFAULT 50,
    "image_scale" INTEGER NOT NULL DEFAULT 100,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_images_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_service_images" ("created_at", "id", "service_id", "sort_order", "url") SELECT "created_at", "id", "service_id", "sort_order", "url" FROM "service_images";
DROP TABLE "service_images";
ALTER TABLE "new_service_images" RENAME TO "service_images";
CREATE INDEX "service_images_service_id_sort_order_idx" ON "service_images"("service_id", "sort_order");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
