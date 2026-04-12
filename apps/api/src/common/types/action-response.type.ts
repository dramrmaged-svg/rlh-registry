export interface ActionResponse<T> {
  record: T;
  alreadyInState: boolean;
}

export function alreadyInState<T>(record: T): ActionResponse<T> {
  return { record, alreadyInState: true };
}

export function transitioned<T>(record: T): ActionResponse<T> {
  return { record, alreadyInState: false };
}
