import { gql } from '@apollo/client/core';
import { switchMap } from 'rxjs/operators';
import { Service, HeaderNames } from '../common';
import { Session } from './classes';
import { createSessionMessage } from './utils';
import { SessionOptions, SessionStorageLike } from './interfaces';
import { SessionStorage } from './session.storage';

export class SessionService extends Service {
  private readonly storage: SessionStorageLike;
  private session: Session = null;

  constructor(options: SessionOptions = {}) {
    super();

    const { storage } = options;

    this.storage = storage ? storage : new SessionStorage();
  }

  get headers(): { [key: string]: any } {
    return this.session
      ? {
          [HeaderNames.AuthToken]: this.session.token,
        }
      : {};
  }

  async verifySession(): Promise<void> {
    await this.restoreSession();

    if (this.session && !this.session.verify()) {
      this.session = null;
    }

    if (!this.session) {
      await this.createSession();
    } else {
      await this.refreshSession();
    }
  }

  async refreshSession(): Promise<void> {
    this.session.refresh();

    await this.storeSession();
  }

  async createSession(ttl?: number): Promise<Session> {
    const { apiService, walletService } = this.services;

    const { walletAddress } = walletService;

    const { code } = await apiService.mutate<{
      code: string;
    }>(
      gql`
        mutation($chainId: Int, $account: String!) {
          code: createSessionCode(chainId: $chainId, account: $account)
        }
      `,
      {
        variables: {
          account: walletAddress,
        },
      },
    );

    const message = createSessionMessage(code);
    const signature = await walletService.personalSignMessage(message);

    const { session } = await apiService.mutate<{
      session: Session;
    }>(
      gql`
        mutation($chainId: Int, $account: String!, $code: String!, $signature: String!, $ttl: Int) {
          session: createSession(chainId: $chainId, account: $account, code: $code, signature: $signature, ttl: $ttl) {
            token
            ttl
            account {
              address
              type
              state
              store
              createdAt
              updatedAt
            }
          }
        }
      `,
      {
        variables: {
          code,
          signature,
          ttl,
          account: walletAddress,
        },
        models: {
          session: Session,
        },
      },
    );

    const { account } = session;

    delete session.account;

    if (account.address !== walletAddress) {
      const { providerType } = walletService.wallet;

      walletService.wallet$.next({
        address: account.address,
        providerType,
      });
    }

    session.refresh();

    this.session = session;

    await this.storeSession();

    return session;
  }

  protected onInit() {
    const { walletAddress$ } = this.services.walletService;

    this.addSubscriptions(
      walletAddress$
        .pipe(switchMap(() => this.restoreSession())) //
        .subscribe(),
    );
  }

  private async storeSession(): Promise<void> {
    const { walletService } = this.services;
    const { walletAddress } = walletService;

    const { token, ttl, expireAt } = this.session;

    await this.storage.setSession(walletAddress, {
      token,
      ttl,
      expireAt,
    });
  }

  private async restoreSession(): Promise<void> {
    let session: Session = null;

    const { walletService } = this.services;
    const { walletAddress } = walletService;

    if (walletAddress) {
      const stored = walletAddress ? await this.storage.getSession(walletAddress) : null;

      session = stored ? new Session(stored) : null;
    }

    this.session = session;
  }
}
