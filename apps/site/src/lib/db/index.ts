import 'server-only';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

const testFetch = async () => {
  //console.log('***PROC', process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  const { data, error } = await supabase.from('test_table').select('*');

  if (error) {
    console.error('***TEST error', error);
    return;
  }

  console.log('***TEST', data);
};

export const db = {
  testFetch,
};
