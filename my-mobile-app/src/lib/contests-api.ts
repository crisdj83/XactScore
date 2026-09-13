import { supabase } from '@/lib/supabase';
import {
  isValidSeasonLength,
  type ContestSeasonLength,
} from '@/lib/contest-season';
import { normalizeContestMemberships } from '@/lib/normalize';
import type { ContestMembership } from '@/lib/types';

function generateContestKey() {
  return Math.random().toString(36).substring(2, 9).toLowerCase();
}

function escapeIlikeExact(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export async function fetchMyContests(userId: string): Promise<ContestMembership[]> {
  const memberSelect = `
      contest_id,
      role,
      joined_at,
      contests (
        name,
        contest_key,
        season_length,
        is_open,
        is_public
      )
    `;

  const { data, error } = await supabase
    .from('contest_members')
    .select(memberSelect)
    .eq('user_id', userId)
    .order('joined_at', { ascending: false });

  if (!error) return normalizeContestMemberships(data);

  const fallback = await supabase
    .from('contest_members')
    .select(
      `
      contest_id,
      role,
      joined_at,
      contests (
        name,
        contest_key,
        season_length,
        is_open
      )
    `
    )
    .eq('user_id', userId)
    .order('joined_at', { ascending: false });

  if (fallback.error) throw new Error(fallback.error.message);
  return normalizeContestMemberships(fallback.data);
}

export async function joinContestWithKey(contestKey: string, userId: string) {
  const key = contestKey.trim().toLowerCase();
  if (!key) throw new Error('Please enter an invitation key.');

  const { data: contest, error: searchError } = await supabase
    .from('contests')
    .select('id')
    .eq('contest_key', key)
    .maybeSingle();

  if (searchError || !contest) {
    throw new Error('Contest not found. Please check the code and try again.');
  }

  const { error: joinError } = await supabase.from('contest_members').insert({
    contest_id: contest.id,
    user_id: userId,
    role: 'member',
  });

  if (joinError && joinError.code === '23505') {
    return contest.id as string;
  }
  if (joinError) {
    throw new Error(`Failed to join contest: ${joinError.message}`);
  }
  return contest.id as string;
}

export async function createContest(options: {
  userId: string;
  name: string;
  seasonLength: ContestSeasonLength;
  visibility: 'public' | 'private';
}) {
  const name = options.name.trim();
  if (!name) throw new Error('Please enter a contest name.');

  const seasonLength: ContestSeasonLength = isValidSeasonLength(options.seasonLength)
    ? options.seasonLength
    : 'full';
  const isPublic = options.visibility === 'public';
  const contestKey = generateContestKey();

  if (isPublic) {
    const { data: existingPublic, error: existingError } = await supabase
      .from('contests')
      .select('id')
      .eq('is_public', true)
      .ilike('name', escapeIlikeExact(name))
      .limit(1)
      .maybeSingle();

    if (!existingError && existingPublic) {
      throw new Error('A public league with this name already exists. Please choose another name.');
    }
  }

  const { data: newContest, error: contestError } = await supabase
    .from('contests')
    .insert({
      admin_id: options.userId,
      name,
      contest_key: contestKey,
      season_length: seasonLength,
      is_public: isPublic,
    })
    .select('id')
    .single();

  if (contestError || !newContest) {
    const missingPublicColumn = /is_public/.test(contestError?.message || '');
    throw new Error(
      missingPublicColumn
        ? 'Public contests need a one-time database update. Paste supabase/public-contests.sql into the Supabase SQL editor, then try again.'
        : `Failed to create contest: ${contestError?.message || 'Contest was not created.'}`
    );
  }

  const { error: memberError } = await supabase.from('contest_members').insert({
    contest_id: newContest.id,
    user_id: options.userId,
    role: 'admin',
  });

  if (memberError) {
    throw new Error(`Failed to join your own contest: ${memberError.message}`);
  }

  return newContest.id as string;
}

export type PublicContest = {
  id: string;
  name: string;
};

export async function fetchPublicContests(): Promise<PublicContest[]> {
  const { data, error } = await supabase
    .from('contests')
    .select('id, name, created_at')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map((row) => ({ id: row.id as string, name: row.name as string }));
}

export async function joinPublicContest(contestId: string, userId: string) {
  const { error } = await supabase.from('contest_members').insert({
    contest_id: contestId,
    user_id: userId,
    role: 'member',
  });

  if (error && error.code === '23505') return contestId;
  if (error) throw new Error(`Failed to join contest: ${error.message}`);
  return contestId;
}
