export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

export class FirestorePermissionError extends Error {
  public readonly context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const message = `The following request was denied by Firestore Security Rules:\n${JSON.stringify(
      {
        operation: context.operation,
        path: context.path,
        ...(context.requestResourceData && {
          data: context.requestResourceData,
        }),
      },
      null,
      2
    )}`;

    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;

    // This is to make the error message more readable in the console
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }

  toString() {
    return `${this.name}: ${this.message}`;
  }
}
