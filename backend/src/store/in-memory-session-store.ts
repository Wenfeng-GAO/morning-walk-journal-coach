import type { Session } from "../domain/session";

export interface SessionStore {
  create(session: Session): void;
  get(sessionId: string): Session | undefined;
  save(session: Session): void;
}

export class InMemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, Session>();

  create(session: Session): void {
    this.sessions.set(session.sessionId, session);
  }

  get(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  save(session: Session): void {
    this.sessions.set(session.sessionId, session);
  }
}
