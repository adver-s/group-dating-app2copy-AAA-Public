import { CognitoIdentityProviderClient, ListUserPoolClientsCommand, DescribeUserPoolClientCommand, UpdateUserPoolClientCommand } from '@aws-sdk/client-cognito-identity-provider';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const argv = yargs(hideBin(process.argv))
  .option('domain', { type: 'string', demandOption: true })
  .option('user-pool-id', { type: 'string', demandOption: true })
  .argv as any;

const REGION = process.env.AWS_REGION || 'ap-northeast-1';
const client = new CognitoIdentityProviderClient({ region: REGION });

async function main() {
  const { domain, userPoolId } = argv;
  const callbackUrl = `https://${domain}/auth/callback`;
  const logoutUrl = `https://${domain}/logout`;

  // 1. Get App Client ID (assume first client)
  const listRes = await client.send(new ListUserPoolClientsCommand({ UserPoolId: userPoolId, MaxResults: 60 }));
  if (!listRes.UserPoolClients || listRes.UserPoolClients.length === 0) {
    throw new Error('No App Clients found for this User Pool');
  }
  const appClientId = listRes.UserPoolClients[0].ClientId!;

  // 2. Get current App Client config
  const descRes = await client.send(new DescribeUserPoolClientCommand({ UserPoolId: userPoolId, ClientId: appClientId }));
  const clientConfig = descRes.UserPoolClient;
  if (!clientConfig) throw new Error('App Client not found');

  let callbackURLs = clientConfig.CallbackURLs || [];
  let logoutURLs = clientConfig.LogoutURLs || [];

  let updated = false;
  if (!callbackURLs.includes(callbackUrl)) {
    callbackURLs = [...callbackURLs, callbackUrl];
    updated = true;
  }
  if (!logoutURLs.includes(logoutUrl)) {
    logoutURLs = [...logoutURLs, logoutUrl];
    updated = true;
  }

  if (updated) {
    await client.send(new UpdateUserPoolClientCommand({
      UserPoolId: userPoolId,
      ClientId: appClientId,
      CallbackURLs: callbackURLs,
      LogoutURLs: logoutURLs,
    }));
    console.log('✅ Updated App Client URLs');
  } else {
    console.log('No update needed. URLs already present.');
  }

  console.log('Final CallbackURLs:', callbackURLs);
  console.log('Final LogoutURLs:', logoutURLs);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}); 