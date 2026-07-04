import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://uemrkhjnfhdswcyclinf.supabase.co',
  'sb_publishable_D-2qOhLWJ5MW-gsYRm_IsA_EoP3WyUX'
);

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'marco@dash.app',
  password: 'M@rc0@123',
});

if (error) {
  console.error('❌ Erro:', error.message);
} else {
  console.log('✅ Login OK! Usuário autenticado:', data.user.email);
}

process.exit(0);
