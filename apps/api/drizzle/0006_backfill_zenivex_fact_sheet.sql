-- Custom SQL migration file, put your code below! --
-- #220: the Zenivex fact sheet used to be matched by trade name in the public spray schedule
-- card. Carry that one URL into the new column, with the same case-insensitive match the card
-- used, so the link is in place on every database the moment the lookup is gone. Rows that
-- already have a fact sheet are left alone, so this never overwrites a staff edit.
UPDATE "insecticides"
SET "fact_sheet_url" = 'https://middlesexmosquito.sharepoint.com/:b:/g/IQA8WAM64HkzSYZ8dAej33eKAQFheJOEA3HntjhHQMKkLSE?e=62lpBx'
WHERE "trade_name" ILIKE '%zenivex%' AND "fact_sheet_url" IS NULL;
