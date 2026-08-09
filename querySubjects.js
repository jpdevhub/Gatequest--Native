require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
async function run() {
  const { data, error } = await supabase.from('subjects').select('name').order('name');
  console.log(data ? data.map(d => d.name) : error);
}
run();
