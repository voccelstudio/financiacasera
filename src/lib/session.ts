import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Family, FamilyMember, Profile } from '@/lib/types'

export interface FamilyContext {
  userId: string
  profile: Profile | null
  family: Family
  membership: FamilyMember
}

/**
 * Obtiene la sesión actual + la familia a la que pertenece el usuario.
 * Redirige a /login si no hay sesión, o a /onboarding si no tiene familia.
 */
export async function getFamilyContext(): Promise<FamilyContext> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase
      .from('family_members')
      .select('*, family:families(*)')
      .eq('user_id', user.id)
      .eq('active', true)
      .limit(1),
  ])

  const membership = memberships?.[0] as
    | (FamilyMember & { family: Family })
    | undefined

  if (!membership || !membership.family) redirect('/onboarding')

  const { family, ...member } = membership

  return {
    userId: user.id,
    profile: (profile as Profile | null) ?? null,
    family,
    membership: member as FamilyMember,
  }
}
