export class StringEmitter {
  private _inline = false;
  private _line = 0;
  private _buffer: string[] = [];

  constructor(private _indent = 0, private _indentChars = '  ') {}

  protected println(str: string = ''): void {
    this.print(str, true);
    this._inline = false;
  }

  protected print(str: string, newLine: boolean = false): void {
    if (this._indent > 0 && !this._inline) {
      const tabs = new Array(this._indent).fill(this._indentChars);
      this._buffer.push(...tabs);
    }

    this._buffer.push(str);

    if (newLine) {
      this._buffer.push('\n');
      this._line++;
    } else {
      this._inline = true;
    }
  }

  protected incIndent(amount: number = 1): void {
    this._indent = this._indent + amount;
  }

  protected decIndent(amount: number = 1): void {
    if (this._indent > 0) {
      this._indent = this._indent - amount;
    }
  }

  protected resetIndent(): void {
    this._indent = 0;
  }

  protected get line(): number {
    return this._line;
  }

  protected get indent(): number {
    return this._indent;
  }

  protected append(emitter: StringEmitter, newLine: boolean = false): void {
    const lines = emitter.toString();
    this.print(lines, newLine);
  }

  protected toString(): string {
    return this._buffer.join('');
  }

  protected clear(): void {
    this.resetIndent();
    this._buffer = [];
    this._line = 0;
    this._inline = false;
  }
}
