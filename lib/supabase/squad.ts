import { supabase } from './client';
import { Squad as APISquad } from '@/lib/api/types';

// Database Squad type (what we get directly from Supabase)
export type DBSquad = {
  id: string;
  name: string;
  created_at: string;
  owner_id: string;
  invite_code: string;
};

export type CreateSquadError = {
  message: string;
};

export type JoinSquadError = {
  message: string;
};

export type UpdateSquadNameError = {
  message: string;
};

export type BoostUserError = {
  message: string;
};

export type RemoveSquadMemberError = {
  message: string;
};

export type LeaveSquadError = {
  message: string;
};

export const createSquad = async (
  squadName: string
): Promise<{ data: DBSquad | null; error: CreateSquadError | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: null,
        error: { message: 'User not authenticated' }
      };
    }

    const { data, error } = await supabase
      .rpc('create_squad', {
        p_squad_name: squadName,
      });

    if (error) {
      return {
        data: null,
        error: { message: error.message }
      };
    }

    return {
      data: data as DBSquad,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: { message: 'An unexpected error occurred' }
    };
  }
};

export const joinSquad = async (
  inviteCode: string
): Promise<{ data: DBSquad | null; error: JoinSquadError | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: null,
        error: { message: 'User not authenticated' }
      };
    }

    const { data, error } = await supabase
      .rpc('join_squad', {
        p_invite_code: inviteCode,
      });

    if (error) {
      return {
        data: null,
        error: { message: error.message }
      };
    }

    return {
      data: data as DBSquad,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: { message: 'An unexpected error occurred' }
    };
  }
};

export const updateSquadName = async (
  squadId: string,
  newName: string
): Promise<{ data: DBSquad | null; error: UpdateSquadNameError | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: null,
        error: { message: 'User not authenticated' }
      };
    }

    const { data, error } = await supabase
      .rpc('update_squad_name', {
        p_squad_id: squadId,
        p_new_name: newName
      });

    if (error) {
      return {
        data: null,
        error: { message: error.message }
      };
    }

    return {
      data: data as DBSquad,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: { message: 'An unexpected error occurred' }
    };
  }
};

export const boostUser = async (
  toUserId: string,
  squadId: string
): Promise<{ data: DBSquad | null; error: BoostUserError | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: null,
        error: { message: 'User not authenticated' }
      };
    }

    const { data, error } = await supabase
      .rpc('boost_user', {
        p_to_user_id: toUserId,
        p_squad_id: squadId
      });

    if (error) {
      return {
        data: null,
        error: { message: error.message }
      };
    }

    return {
      data: data as DBSquad,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: { message: 'An unexpected error occurred' }
    };
  }
};

export const removeSquadMember = async (
  squadId: string,
  userToRemove: string
): Promise<{ data: DBSquad | null; error: RemoveSquadMemberError | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: null,
        error: { message: 'User not authenticated' }
      };
    }

    const { data, error } = await supabase
      .rpc('remove_squad_member', {
        p_squad_id: squadId,
        p_user_to_remove: userToRemove
      });

    if (error) {
      return {
        data: null,
        error: { message: error.message }
      };
    }

    return {
      data: data as DBSquad,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: { message: 'An unexpected error occurred' }
    };
  }
};

export const leaveSquad = async (
  squadId: string
): Promise<{ data: DBSquad | null; error: LeaveSquadError | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        data: null,
        error: { message: 'User not authenticated' }
      };
    }

    const { data, error } = await supabase
      .rpc('leave_squad', {
        p_squad_id: squadId
      });

    if (error) {
      return {
        data: null,
        error: { message: error.message }
      };
    }

    return {
      data: data as DBSquad,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: { message: 'An unexpected error occurred' }
    };
  }
}; 