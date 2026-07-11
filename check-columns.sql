-- Jalankan ini di pgweb, lalu screenshot atau copy-paste hasilnya ke chat
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_name IN ('Tenant', 'Product', 'Message')
ORDER BY table_name, ordinal_position;
