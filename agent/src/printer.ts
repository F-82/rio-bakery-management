export interface Printer {
  print(text: string): Promise<void>;
}

export class ConsolePrinter implements Printer {
  async print(text: string): Promise<void> {
    console.log("========== PRINT JOB ==========");
    console.log(text);
    console.log("===============================\n");
  }
}

export class EscPosPrinter implements Printer {
  async print(text: string): Promise<void> {
    // Throws an error to simulate the behavior requested in the spec
    // ("once we know the hardware").
    // We log it so the developer knows why it failed if they try to use it.
    throw new Error("EscPosPrinter is not yet implemented. Hardware unknown.");
  }
}
