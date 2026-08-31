-- CreateTable
CREATE TABLE "service_images" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "service_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "service_images_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "service_images_service_id_sort_order_idx" ON "service_images"("service_id", "sort_order");
