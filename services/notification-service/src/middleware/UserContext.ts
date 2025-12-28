export interface IUserContext {
  userId?: string;
  role?: string;
  authenticated: boolean;
}

export class UserContext {
  private static context: IUserContext | null = null;

  static set(context: IUserContext): void {
    UserContext.context = context;
  }

  static get(): IUserContext | null {
    return UserContext.context;
  }

  static clear(): void {
    UserContext.context = null;
  }
}
