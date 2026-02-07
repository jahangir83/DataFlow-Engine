import { Transform, TransformCallback } from "stream";

export class JsonlTransform extends Transform {
  constructor() {
    super({ writableObjectMode: true, objectMode: true });
  }

  _transform(chunk: any, _enc: BufferEncoding, callback: TransformCallback) {
    try {
      callback(null, JSON.stringify(chunk) + "\n");
    } catch (error: any | null) {
      callback(error);
    }
  }
}
