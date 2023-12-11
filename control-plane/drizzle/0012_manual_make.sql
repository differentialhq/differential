-- fill NULL cluster_id in the table machines with -1
UPDATE machines SET cluster_id = '-1' WHERE cluster_id IS NULL;
