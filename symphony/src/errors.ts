export class WorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkflowError';
  }
}

export class LinearError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LinearError';
  }
}

export class AppServerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppServerError';
  }
}

export class UserInputRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserInputRequiredError';
  }
}
