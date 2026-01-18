const connectAurora = require('./connectAurora');

async function insertSampleData() {
  let connection;
  
  try {
    connection = await connectAurora();
    
    console.log('📝 Inserting sample data...');
    
    // Insert sample users with specific UUIDs
    const sampleUsers = [
      ['550e8400-e29b-41d4-a716-446655440001', 'user1@example.com', 'user1', 'password123', 'Tokyo', 25, 'female'],
      ['550e8400-e29b-41d4-a716-446655440002', 'user2@example.com', 'user2', 'password123', 'Osaka', 28, 'male'],
      ['550e8400-e29b-41d4-a716-446655440003', 'user3@example.com', 'user3', 'password123', 'Kyoto', 26, 'female'],
      ['550e8400-e29b-41d4-a716-446655440004', 'user4@example.com', 'user4', 'password123', 'Fukuoka', 27, 'male']
    ];
    
    for (const [id, email, username, password, location, age, gender] of sampleUsers) {
      await connection.execute(`
        INSERT INTO users (id, email, username, password_hash, location, age, gender)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        location = VALUES(location), age = VALUES(age), gender = VALUES(gender)
      `, [id, email, username, password, location, age, gender]);
    }
    
    console.log('✅ Sample users inserted successfully');
    
    // Insert sample teams
    const sampleTeams = [
      ['650e8400-e29b-41d4-a716-446655440001', 'Team Alpha', 'A fun group from Tokyo', 'Tokyo', 4, '550e8400-e29b-41d4-a716-446655440001'],
      ['650e8400-e29b-41d4-a716-446655440002', 'Team Beta', 'Adventure seekers from Osaka', 'Osaka', 4, '550e8400-e29b-41d4-a716-446655440002'],
      ['650e8400-e29b-41d4-a716-446655440003', 'Team Gamma', 'Food lovers from Kyoto', 'Kyoto', 4, '550e8400-e29b-41d4-a716-446655440003'],
      ['650e8400-e29b-41d4-a716-446655440004', 'Team Delta', 'Sports enthusiasts from Fukuoka', 'Fukuoka', 4, '550e8400-e29b-41d4-a716-446655440004']
    ];
    
    for (const [id, name, description, location, maxMembers, createdBy] of sampleTeams) {
      await connection.execute(`
        INSERT INTO teams (id, name, description, location, max_members, created_by)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
        name = VALUES(name), description = VALUES(description), location = VALUES(location)
      `, [id, name, description, location, maxMembers, createdBy]);
    }
    
    console.log('✅ Sample teams inserted successfully');
    
    // Add team members
    await connection.execute(`
      INSERT INTO team_members (id, team_id, user_id, role)
      SELECT 
        UUID(),
        t.id,
        t.created_by,
        'leader'
      FROM teams t
      ON DUPLICATE KEY UPDATE role = 'leader'
    `);
    
    console.log('✅ Team members inserted successfully');
    
    // Insert sample swipe actions
    const sampleSwipeActions = [
      ['750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002', 'like'],
      ['750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440003', 'hold'],
      ['750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 'like'],
      ['750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440004', 'pass']
    ];
    
    for (const [id, userId, targetTeamId, action] of sampleSwipeActions) {
      await connection.execute(`
        INSERT INTO swipe_actions (id, user_id, target_team_id, action)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE action = VALUES(action)
      `, [id, userId, targetTeamId, action]);
    }
    
    console.log('✅ Sample swipe actions inserted successfully');
    
    console.log('✅ All sample data inserted successfully');
    
  } catch (error) {
    console.error('❌ Error inserting sample data:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

module.exports = insertSampleData; 