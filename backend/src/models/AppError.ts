class AppError extends Error {
  customErrorName: string = "";
  customErrorMessage: string = "";

  constructor(err: Error, customName: string = "", customMessage: string = "") {
    super(err.message);
    this.customErrorName = customName;
    this.customErrorMessage = customMessage;
  };

  LogError = () => {
    console.log(`${this.customErrorName}: ${this.customErrorMessage}`);
    console.error(this.message);
  };
};

export default AppError;
