import React, { createContext, useState, useContext, ReactNode } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from './AuthContext';
import { useUser } from './UserContext';
import { SquadsAPI } from '@/lib/api/squads';
import type { Squad, SquadMember as APISquadMember } from '@/lib/api/types';
import { registerContextSetters } from '@/lib/services/logoutService';

export type SquadMember = APISquadMember;

type SquadContextType = {
  squadMembers: SquadMember[];
  hasJoinedSquad: boolean;
  refreshSquad: (overrideSquadId?: string) => Promise<void>;
  squadName: string;
  squadId: string | null;
  squadStreak: number;
  squadHabits: number;
  squadEnergy: number;
  feed: any[];
  createSquad: (name: string) => Promise<void>;
  joinSquad: (inviteCode: string) => Promise<void>;
  squadData: Squad | null;
  clearSquad: () => void;
};

const SquadContext = createContext<SquadContextType>({
  squadMembers: [],
  hasJoinedSquad: false,
  refreshSquad: async () => {},
  squadName: '',
  squadId: null,
  squadStreak: 0,
  squadHabits: 0,
  squadEnergy: 0,
  feed: [],
  createSquad: async () => {},
  joinSquad: async () => {},
  squadData: null,
  clearSquad: () => {},
});

export const SquadProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [squadData, setSquadData] = useState<Squad | null>(null);
  const [hasJoinedSquad, setHasJoinedSquad] = useState(false);
  const { session } = useAuth();
  const { user, updateUser } = useUser();

  const refreshSquad = async (overrideSquadId?: string) => {
    try {
      if (!session?.access_token) {
        console.log('[SquadContext] No session token, skipping squad refresh');
        setHasJoinedSquad(false);
        setSquadData(null);
        return;
      }

      console.log('Squad refresh: Checking squad membership...');
      const squadsAPI = new SquadsAPI(session.access_token);
      
      // Use override squad_id if provided, otherwise use from user context
      const squadId = overrideSquadId || user.squad_id;

      if (!squadId) {
        console.log('Squad refresh: No squad_id available');
        setHasJoinedSquad(false);
        setSquadData(null);
        return;
      }

      console.log('Squad refresh: Found squad_id, fetching squad details...', squadId);
      // Then fetch the squad details
      const squad = await squadsAPI.getSquad(squadId);
      setSquadData(squad);
      setHasJoinedSquad(true);
    } catch (error) {
      console.error('Squad refresh: Error refreshing squad:', error);
      setHasJoinedSquad(false);
      setSquadData(null);
    }
  };

  const createSquad = async (name: string) => {
    if (!session?.access_token) return;
    const { data, error } = await supabase.rpc('create_squad', { p_squad_name: name });
    if (error) throw error;
    
    if (data) {
      console.log('Updating user context with squad_id:', data);
      updateUser({ squad_id: data });
      await refreshSquad(data); // Pass the squad_id directly
    }
  };

  const joinSquad = async (inviteCode: string) => {
    if (!session?.access_token) return;
    const { data, error } = await supabase.rpc('join_squad', { p_invite_code: inviteCode });
    if (error) throw error;
    
    if (data) {
      console.log('Updating user context with squad_id:', data);
      updateUser({ squad_id: data });
      await refreshSquad(data); // Pass the squad_id directly
    }
  };

  const clearSquad = () => {
    console.log('[SquadContext] Clearing squad data');
    setSquadData(null);
    setHasJoinedSquad(false);
  };

  // Register the clearSquad function with the logout service
  React.useEffect(() => {
    registerContextSetters({ clearSquad });
  }, []);

  return (
    <SquadContext.Provider
      value={{
        squadMembers: squadData?.members || [],
        hasJoinedSquad,
        refreshSquad,
        squadName: squadData?.name || '',
        squadId: squadData?.squad_id || null,
        squadStreak: squadData?.squad_streak || 0,
        squadHabits: squadData?.squad_habits || 0,
        squadEnergy: squadData?.squad_energy || 0,
        feed: squadData?.feed || [],
        createSquad,
        joinSquad,
        squadData,
        clearSquad,
      }}
    >
      {children}
    </SquadContext.Provider>
  );
};

export const useSquad = () => {
  const context = useContext(SquadContext);
  if (!context) {
    throw new Error('useSquad must be used within a SquadProvider');
  }
  return context;
};