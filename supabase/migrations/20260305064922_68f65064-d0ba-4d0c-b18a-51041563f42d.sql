SELECT cron.schedule(
  'monthly-status-reminders',
  '0 9 1 * *',
  $$
  SELECT net.http_post(
    url := 'https://yhfuhprleqdkcbyftyoy.supabase.co/functions/v1/send-status-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InloZnVocHJsZXFka2NieWZ0eW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2NTc1NjgsImV4cCI6MjA2ODIzMzU2OH0.4uAckQSoYQSvpslOa4WJnCOlYiBYSrk49IlNHbu2vgk"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);