import { JsonlTransform } from "./JsonlTransform";
import { MetricsTransform } from "./MetricsTransform";
import type { Readable, Writable } from "stream";
import { pipeline } from "stream/promises";

export async function runPipeline(
  source: Readable,
  ...rest: Array<NodeJS.ReadWriteStream | Writable>
) {
  try {
    return await pipeline(source, ...(rest as any));
  } catch (error) {
    console.error("Pipeline failed with error:", error);
  }
}
