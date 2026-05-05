import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createUser(email: string, password: string, fullName: string, role: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role
    }
  })

  if (error) {
    console.error('Error creating user:', error)
    return
  }

  console.log('User created successfully:', data.user)

  // Also create profile in public.profiles
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email: data.user.email!,
        full_name: fullName,
        role
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
    } else {
      console.log('Profile created successfully')
    }
  }
}

// Example usage - modify these values
createUser('user1@example.com', 'password123', 'Juan Pérez', 'client')
createUser('user2@example.com', 'password123', 'María García', 'lawyer')
