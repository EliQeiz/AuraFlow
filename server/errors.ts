export class BusinessError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

export type Actor = { uid: string; admin: boolean }
