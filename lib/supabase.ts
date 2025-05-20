import { createClient } from "@supabase/supabase-js"

// Создаем клиент для серверных компонентов
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  })
}

// Создаем клиент для клиентских компонентов
let clientSupabase: ReturnType<typeof createClient> | null = null

export const getClientSupabaseClient = () => {
  if (clientSupabase) return clientSupabase

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  clientSupabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  })
  return clientSupabase
}
