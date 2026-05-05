import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function listAllUsers() {
  console.log('🔍 Listing all users in auth.users...')
  
  const { data, error } = await supabase.auth.admin.listUsers()
  
  if (error) {
    console.error('Error listing users:', error)
    return
  }
  
  console.log(`Found ${data.users.length} users:`)
  data.users.forEach(user => {
    console.log(`- Email: ${user.email}, ID: ${user.id}, Deleted: ${user.deleted_at ? 'Yes' : 'No'}`)
  })
}

async function deleteUserByEmail(email: string) {
  console.log(`🗑️  Attempting to delete user: ${email}`)
  
  const { data, error } = await supabase.auth.admin.listUsers()
  
  if (error) {
    console.error('Error listing users:', error)
    return
  }
  
  const user = data.users.find(u => u.email === email)
  
  if (!user) {
    console.log('User not found')
    return
  }
  
  console.log(`Found user: ${user.id}`)
  
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
  
  if (deleteError) {
    console.error('Error deleting user:', deleteError)
  } else {
    console.log('✅ User deleted successfully')
  }
}

// List all users
listAllUsers()

// Delete the existing users
deleteUserByEmail('josvaneiba@gmail.com')
deleteUserByEmail('josneiba10@gmail.com')
