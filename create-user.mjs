import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uemrkhjnfhdswcyclinf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_D-2qOhLWJ5MW-gsYRm_IsA_EoP3WyUX';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const username = 'marco';
const email = `${username}@dash.app`;
const password = 'M@rc0@123';
const fullName = 'Marco';

async function createUser() {
  console.log(`Criando usuário: ${email}`);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    console.error('❌ Erro ao criar usuário:', error.message);
    process.exit(1);
  }

  if (data.user) {
    console.log('✅ Usuário criado com sucesso!');
    console.log('   E-mail:', data.user.email);
    console.log('   ID:', data.user.id);
    console.log('   Senha: M@rc0@123');

    if (data.user.email_confirmed_at) {
      console.log('   Status: E-mail confirmado ✅');
    } else {
      console.log('   Status: Aguardando confirmação de e-mail (verifique se a confirmação está desabilitada no Supabase)');
    }
  }
}

createUser();
