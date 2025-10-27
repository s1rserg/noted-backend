import type { ConfigService } from '@infrastructure/config-service/index.js';
import type { TokenPayloadWithEmail } from '../types.js';
import { InternalServerErrorException } from '@exceptions';

import { OAuth2Client } from 'google-auth-library';

export class OAuthService {
  constructor(private readonly configService: ConfigService) {}
  client = new OAuth2Client();

  async getGoogleProfile(credential: string): Promise<TokenPayloadWithEmail> {
    const ticket = await this.client.verifyIdToken({
      idToken: credential,
      audience: this.configService.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      throw new InternalServerErrorException('Google did not return a payload');
    }

    return payload as TokenPayloadWithEmail;
  }
}
