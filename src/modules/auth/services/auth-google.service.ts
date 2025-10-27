import type { SignInGoogleDto, TokensPair } from '../types.js';
import { AuthProvider } from '../enums/auth-provider.enum.js';
import type { AuthRepository } from '../repositories/auth.repository.js';
import type { AuthRegistrationService } from './auth-registration.service.js';
import type { JwtService } from './jwt.service.js';
import type { OAuthService } from './oauth.service.js';

export class AuthGoogleService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly authRegistrationService: AuthRegistrationService,
    private readonly oAuthService: OAuthService,
  ) {}

  async signIn(signInDto: SignInGoogleDto): Promise<TokensPair> {
    const { email, given_name, family_name } = await this.oAuthService.getGoogleProfile(
      signInDto.credential,
    );

    const existingAuth = await this.authRepository.findByEmailAndProvider(
      email,
      AuthProvider.GOOGLE,
    );

    if (existingAuth) {
      return this.jwtService.signTokensPair({
        id: existingAuth.userId,
        email: existingAuth.email,
        provider: existingAuth.provider,
      });
    }

    const auth = await this.authRegistrationService.registerUser({
      email,
      provider: AuthProvider.GOOGLE,
      name: given_name,
      surname: family_name,
    });

    return this.jwtService.signTokensPair({
      id: auth.userId,
      email: auth.email,
      provider: auth.provider,
    });
  }
}
