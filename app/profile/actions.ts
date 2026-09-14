'use server'

import { createClient } from '../../lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const username = formData.get('username') as string
  const favoriteTeam = formData.get('favorite_team') as string
  const newAvatarUrl = formData.get('avatar_url') as string
  const quote = String(formData.get('quote') || '').trim().slice(0, 18)

  // Fetch their current approved avatar to see if they are trying to change it
  const { data: currentUser } = await supabase
    .from('users')
    .select('avatar_url')
    .eq('id', user.id)
    .single()

  // Base update payload with just the text fields
  const updatePayload: {
    username: string
    favorite_team: string
    quote: string
    pending_avatar_url?: string | null
    avatar_url?: string | null
  } = {
    username,
    favorite_team: favoriteTeam,
    quote,
  }

  let message = 'Profile updated successfully!'

  // If they submitted a URL that is different from their current approved avatar, push it to pending
  if (newAvatarUrl && newAvatarUrl !== currentUser?.avatar_url) {
    updatePayload.pending_avatar_url = newAvatarUrl
    message = 'Profile updated! Your new picture is pending admin approval.'
  } else if (!newAvatarUrl) {
    // If they cleared the box, we can just delete the avatars immediately
    updatePayload.avatar_url = null
    updatePayload.pending_avatar_url = null
  }

  // Update the database
  const { error } = await supabase
    .from('users')
    .update(updatePayload)
    .eq('id', user.id)

  if (error) {
    redirect(`/profile?error=${error.message}`)
  }

  revalidatePath('/', 'layout')
  revalidatePath('/contests', 'layout')
  
  // REDIRECT TO HOME PAGE INSTEAD OF PROFILE
  redirect(`/?success=${encodeURIComponent(message)}`)
}

export async function changePassword(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) redirect('/login')

  const currentPassword = String(formData.get('current_password') || '')
  const newPassword = String(formData.get('new_password') || '')
  const confirmPassword = String(formData.get('confirm_password') || '')

  const fail = (message: string) => {
    redirect(`/profile?error=${encodeURIComponent(message)}`)
  }

  if (!currentPassword) {
    fail('Current password is incorrect')
  }
  if (newPassword.length < 6) {
    fail('Password must be at least 6 characters.')
  }
  if (newPassword !== confirmPassword) {
    fail('New passwords do not match')
  }
  if (currentPassword === newPassword) {
    fail('New password must be different from your current password')
  }

  const { error: currentError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (currentError) {
    fail('Current password is incorrect')
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
    current_password: currentPassword,
  })
  if (error) {
    const message = error.message || 'Could not update password'
    fail(message.toLowerCase().includes('current password') ? 'Current password is incorrect' : message)
  }

  revalidatePath('/profile')
  redirect(`/profile?success=${encodeURIComponent('Password updated successfully!')}`)
}

/** Permanent account deletion for App Store Guideline 5.1.1(v). */
export async function deleteAccount() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { createAdminClient } = await import('../../lib/supabase/admin')
  const db = createAdminClient()
  const userId = user.id

  const { data: owned, error: ownedError } = await db
    .from('contests')
    .select('id')
    .eq('admin_id', userId)

  if (ownedError) {
    redirect(`/profile?error=${encodeURIComponent(ownedError.message)}`)
  }

  const ownedIds = (owned || []).map((row) => row.id as string)
  if (ownedIds.length) {
    const { error: deleteContestsError } = await db.from('contests').delete().in('id', ownedIds)
    if (deleteContestsError) {
      redirect(
        `/profile?error=${encodeURIComponent(`Could not remove administered leagues: ${deleteContestsError.message}`)}`,
      )
    }
  }

  for (const table of [
    'content_reports',
    'user_blocks',
    'expo_push_tokens',
    'push_subscriptions',
    'match_reminders',
    'message_reads',
    'news_reads',
    'suggestions',
  ] as const) {
    try {
      if (table === 'content_reports') {
        await db.from(table).delete().or(`reporter_id.eq.${userId},target_user_id.eq.${userId}`)
      } else if (table === 'user_blocks') {
        await db.from(table).delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`)
      } else {
        await db.from(table).delete().eq('user_id', userId)
      }
    } catch {
      // optional
    }
  }

  const { error: profileDeleteError } = await db.from('users').delete().eq('id', userId)
  if (profileDeleteError) {
    redirect(
      `/profile?error=${encodeURIComponent(
        `Could not remove profile data: ${profileDeleteError.message}. Run supabase/fix_contests_admin_cascade.sql.`,
      )}`,
    )
  }

  const { error: authDeleteError } = await db.auth.admin.deleteUser(userId)
  if (authDeleteError) {
    redirect(`/profile?error=${encodeURIComponent(authDeleteError.message)}`)
  }

  await supabase.auth.signOut()
  redirect('/login?message=' + encodeURIComponent('Your account has been permanently deleted.'))
}