import { AuthProvider } from '../enums/auth-provider.enum.js';
import type { AuthEntity } from '../entities/auth.entity.js';
import type { AuthRepository } from '../repositories/auth.repository.js';
import type { AuthRegistrationService } from './auth-registration.service.js';

export class AuthGoogleService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly authRegistrationService: AuthRegistrationService,
  ) {}

  async signInOrSignUp(email: string): Promise<AuthEntity> {
    const existingAuth = await this.authRepository.findByEmailAndProvider(
      email,
      AuthProvider.GOOGLE,
    );

    if (existingAuth) return existingAuth;

    const auth = await this.authRegistrationService.registerUser({
      email,
      provider: AuthProvider.GOOGLE,
    });

    return auth;
  }
}
