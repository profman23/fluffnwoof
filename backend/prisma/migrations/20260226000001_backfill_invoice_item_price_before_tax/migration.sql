-- Backfill priceBeforeTax for existing invoice items where it's NULL
-- Calculate from unitPrice (which is priceAfterTax) and taxRate
UPDATE "invoice_items"
SET "priceBeforeTax" = "unitPrice" / (1 + "taxRate" / 100)
WHERE "priceBeforeTax" IS NULL;
