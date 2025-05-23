import express, { Request, Response } from 'express';
import chalk from 'chalk';
import { exec } from 'child_process';

const app = express();
const port = 3000;

interface TokenResult {
  accessToken: string;
  tokenType: string;
  expires_on: number;
}

function convertExpiresOnToExpiresIn(expiresOn: number): number {
  // Get the current time in seconds since the Unix epoch
  const currentTimeInSeconds = Math.floor(Date.now() / 1000);
  return expiresOn - currentTimeInSeconds;
}

app.use(express.urlencoded({ extended: true }));

app.post('/:tenantId/oauth2/v2.0/token', (req: Request, res: Response) => {
  const tenantId: string = req.params.tenantId;
  const scope: string = req.body.scope;

  console.log('TenantId: ', chalk.green(tenantId));
  console.log('Scope: ', chalk.green(scope));

  exec(`az account get-access-token --tenant ${tenantId} --scope ${scope}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send('Error fetching token');
    }

    try {
      const result: TokenResult = JSON.parse(stdout.trim());
      const response = {
        access_token: result.accessToken,
        token_type: result.tokenType,
        expires_in: convertExpiresOnToExpiresIn(result.expires_on),
        scope: scope
      };
      console.log('Response:', response);
      console.log('Token expires on:', chalk.blue(new Date(Date.now() + response.expires_in * 1000).toLocaleString()));
      res.send(response);
    } catch (parseError) {
      console.error(`JSON parse error: ${parseError}`);
      res.status(500).send('Error parsing token response');
    }
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});