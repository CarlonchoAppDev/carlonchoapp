import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vogqpbktzaobbrbdalqk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZ3FwYmt0emFvYmJyYmRhbHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0OTAwOTcsImV4cCI6MjA2OTA2NjA5N30.NNZ-GeIV8qpK5xyHj_7wMJKCAwx1wChlFoYcht38tc0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);