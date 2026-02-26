import { Transform, TransformCallback } from "stream";

export type Metrics = {
  rows: number;
  bytes: number;
};

export class MetricsTransform extends Transform {
  metrics: Metrics = { rows: 0, bytes: 0 };

  constructor() {
    super();
  }

  _transform(chunk: any, _: BufferEncoding, callback: TransformCallback) {
    // Example: add metrics

    this.metrics.rows += 1;
    this.metrics.bytes += Buffer.byteLength(chunk);
    callback(null, chunk);
  }
}
