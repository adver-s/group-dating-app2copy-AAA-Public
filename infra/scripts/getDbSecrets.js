const secretsManager = require('./secretsManagerClient');

async function getDbSecrets() {
  try {
    const dbSecrets = await secretsManager.getSecret('dating-app/db-credentials');
    console.log('✅ Database secrets retrieved successfully');
    return dbSecrets;
  } catch (error) {
    console.error('❌ Failed to retrieve database secrets:', error.message);
    throw error;
  }
}

module.exports = getDbSecrets; 