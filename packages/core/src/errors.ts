export class SeedlayerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SeedlayerError";
  }
}
