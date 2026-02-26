import { Transform, TransformCallback } from "stream";

export class RowCounterTransform extends Transform {
  public rowCount = 0;
  constructor() {
    super({ writableObjectMode: true, readableObjectMode: true });
  }

  _transform(chunk: any, _enc: BufferEncoding, callback: TransformCallback) {
    this.rowCount++;
    console.log(
      `[RowCounter] Processed row ${this.rowCount} and chunk=${chunk ? chunk.length : "null"}`,
    );
    this.push(chunk);
    callback();
  }
}
