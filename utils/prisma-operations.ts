import { prisma } from './prisma';

// User operations - using raw SQL to match actual DB structure
export const userOperations = {
  // Get user by ID
  async getUserById(id: string): Promise<any> {
    try {
      const { executeQuery } = await import('./database');
      const users = await executeQuery(`
        SELECT * FROM users WHERE id = ?
      `, [id]) as any[];
      return users[0] || null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<any> {
    const { executeQuery } = await import('./database');
    const users = await executeQuery(`
      SELECT * FROM users WHERE email = ?
    `, [email]) as any[];
    return users[0] || null;
  },

  // Create new user
  async createUser(data: {
    id: string;
    email: string;
    username: string;
    passwordHash: string;
  }): Promise<any> {
    const { executeQuery } = await import('./database');
    await executeQuery(`
      INSERT INTO users (id, email, username, password_hash)
      VALUES (?, ?, ?, ?)
    `, [data.id, data.email, data.username, data.passwordHash]);
    return data;
  },

  // Update user
  async updateUser(id: string, data: any): Promise<any> {
    const { executeQuery } = await import('./database');
    const updateFields = [];
    const values = [];
    
    if (data.email !== undefined) {
      updateFields.push('email = ?');
      values.push(data.email);
    }
    if (data.username !== undefined) {
      updateFields.push('username = ?');
      values.push(data.username);
    }
    if (data.passwordHash !== undefined) {
      updateFields.push('password_hash = ?');
      values.push(data.passwordHash);
    }
    
    if (updateFields.length > 0) {
      values.push(id);
      await executeQuery(`
        UPDATE users SET ${updateFields.join(', ')} WHERE id = ?
      `, values);
    }
    
    return this.getUserById(id);
  },

  // Get all users
  async getAllUsers(): Promise<any[]> {
    const { executeQuery } = await import('./database');
    return await executeQuery(`
      SELECT * FROM users WHERE is_active = TRUE
    `) as any[];
  }
};

// Team operations - using raw SQL to match actual DB structure
export const teamOperations = {
  // Get team by ID
  async getTeamById(id: string): Promise<any> {
    const { executeQuery } = await import('./database');
    const teams = await executeQuery(`
      SELECT * FROM teams WHERE id = ?
    `, [id]) as any[];
    return teams[0] || null;
  },

  // Get all teams
  async getAllTeams(): Promise<any[]> {
    const { executeQuery } = await import('./database');
    return await executeQuery(`
      SELECT * FROM teams WHERE is_active = TRUE
    `) as any[];
  },

  // Create new team
  async createTeam(data: {
    name: string;
    description: string;
    gender?: number;
    targetGenderPreferences?: number[];
    createdBy: string;
  }): Promise<any> {
    const { executeQuery } = await import('./database');
    const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await executeQuery(`
      INSERT INTO teams (id, name, description, gender, target_gender_preferences, created_by, is_active)
      VALUES (?, ?, ?, ?, ?, ?, TRUE)
    `, [
      teamId,
      data.name,
      data.description,
      data.gender || 1,
      JSON.stringify(data.targetGenderPreferences || [1]),
      data.createdBy
    ]);
    
    return { id: teamId, ...data };
  },

  // Update team
  async updateTeam(id: string, data: any): Promise<any> {
    const { executeQuery } = await import('./database');
    const updateFields = [];
    const values = [];
    
    if (data.name !== undefined) {
      updateFields.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updateFields.push('description = ?');
      values.push(data.description);
    }
    if (data.gender !== undefined) {
      updateFields.push('gender = ?');
      values.push(data.gender);
    }
    if (data.targetGenderPreferences !== undefined) {
      updateFields.push('target_gender_preferences = ?');
      values.push(JSON.stringify(data.targetGenderPreferences));
    }
    
    if (updateFields.length > 0) {
      values.push(id);
      await executeQuery(`
        UPDATE teams SET ${updateFields.join(', ')} WHERE id = ?
      `, values);
    }
    
    return this.getTeamById(id);
  },

  // Get user's teams
  async getUserTeams(userId: string): Promise<any[]> {
    const { executeQuery } = await import('./database');
    return await executeQuery(`
      SELECT t.*, tm.is_active as user_is_active
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = ? AND t.is_active = TRUE
    `, [userId]) as any[];
  }
};

// TeamMember operations - using raw SQL
export const teamMemberOperations = {
  // Add member to team
  async addMemberToTeam(data: {
    teamId: string;
    userId: string;
  }): Promise<any> {
    const { executeQuery } = await import('./database');
    const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await executeQuery(`
      INSERT INTO team_members (id, team_id, user_id, is_active)
      VALUES (?, ?, ?, TRUE)
    `, [memberId, data.teamId, data.userId]);
    
    return { id: memberId, ...data };
  },

  // Remove member from team
  async removeMemberFromTeam(teamId: string, userId: string): Promise<any> {
    const { executeQuery } = await import('./database');
    await executeQuery(`
      DELETE FROM team_members WHERE team_id = ? AND user_id = ?
    `, [teamId, userId]);
  },

  // Get team members
  async getTeamMembers(teamId: string): Promise<any[]> {
    const { executeQuery } = await import('./database');
    return await executeQuery(`
      SELECT tm.*, u.username, u.email
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = ?
    `, [teamId]) as any[];
  }
};

// GroupMatchingFlow operations - using raw SQL
export const matchingFlowOperations = {
  // Create matching flow
  async createMatchingFlow(data: {
    fromGroupId: string;
    toGroupId: string;
    status?: number;
  }): Promise<any> {
    const { executeQuery } = await import('./database');
    const matchingId = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await executeQuery(`
      INSERT INTO group_matching_flows (id, from_group_id, to_group_id, status)
      VALUES (?, ?, ?, ?)
    `, [matchingId, data.fromGroupId, data.toGroupId, data.status || 0]);
    
    return { id: matchingId, ...data };
  },

  // Get matching flows for a team
  async getMatchingFlowsForTeam(teamId: string): Promise<any[]> {
    const { executeQuery } = await import('./database');
    return await executeQuery(`
      SELECT * FROM group_matching_flows 
      WHERE from_group_id = ? OR to_group_id = ?
    `, [teamId, teamId]) as any[];
  },

  // Update matching flow status
  async updateMatchingFlowStatus(matchingId: string, status: number): Promise<any> {
    const { executeQuery } = await import('./database');
    await executeQuery(`
      UPDATE group_matching_flows SET status = ? WHERE id = ?
    `, [status, matchingId]);
  }
};

// Utility functions
export const utilityOperations = {
  // Get teams with stats
  async getTeamsWithStats(userId?: string) {
    const { executeQuery } = await import('./database');
    const teams = await executeQuery(`
      SELECT t.*, COUNT(tm.user_id) as member_count
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.is_active = TRUE
      WHERE t.is_active = TRUE
      GROUP BY t.id
    `) as any[];

    return teams;
  },

  // Get user's active team
  async getUserTeam(userId: string) {
    const { executeQuery } = await import('./database');
    const teams = await executeQuery(`
      SELECT t.*, tm.is_active as user_is_active
      FROM teams t
      JOIN team_members tm ON t.id = tm.team_id
      WHERE tm.user_id = ? AND tm.is_active = TRUE AND t.is_active = TRUE
      LIMIT 1
    `, [userId]) as any[];

    return teams[0] || null;
  }
}; 