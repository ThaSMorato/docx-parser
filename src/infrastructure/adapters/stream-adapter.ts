import type { ReadStream } from 'node:fs';
import type { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';

/**
 * StreamAdapter - Class for converting normal ReadStream to web ReadableStream
 */
export class StreamAdapter {
  /**
   * Converts a Node.js ReadStream to web ReadableStream
   * @param readStream - Node.js read stream (fs.ReadStream)
   * @returns Web API ReadableStream
   */
  static toWebStream(readStream: ReadStream): ReadableStream<Uint8Array> {
    return new ReadableStream<Uint8Array>({
      start(controller) {
        readStream.on('data', (chunk: string | Buffer) => {
          // Efficiently converts Buffer to Uint8Array
          const buffer = chunk instanceof Buffer ? chunk : Buffer.from(chunk);
          const uint8Array = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);

          controller.enqueue(uint8Array);
        });

        readStream.on('end', () => {
          controller.close();
        });

        readStream.on('error', (error) => {
          controller.error(error);
        });
      },

      cancel() {
        // Cleans up the stream if cancelled
        readStream.destroy();
      }
    });
  }

  /**
   * Checks if it's a Web ReadableStream
   */
  private static isWebReadableStream(stream: any): stream is ReadableStream<Uint8Array> {
    return stream && typeof stream.getReader === 'function';
  }

  /**
   * Checks if it's a Node.js Readable stream
   */
  private static isNodeReadableStream(stream: any): stream is Readable {
    return stream && typeof stream.read === 'function' && typeof stream.on === 'function';
  }

  /**
   * Converts Node.js Readable stream to Buffer
   */
  private static async nodeStreamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Converts Web ReadableStream to Buffer
   */
  private static async webStreamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    const reader = stream.getReader();

    try {
      let done = false;
      while (!done) {
        const result = await reader.read();
        done = result.done;
        if (result.value) {
          chunks.push(result.value);
        }
      }
    } finally {
      reader.releaseLock();
    }

    return Buffer.concat(chunks);
  }

  /**
   * Converts ReadableStream (Web or Node.js) to Buffer
   * Automatically detects stream type and uses appropriate conversion
   * @param stream - Web ReadableStream or Node.js Readable stream
   * @returns Promise that resolves to Buffer
   */
  static async toBuffer(stream: ReadableStream<Uint8Array> | Readable): Promise<Buffer> {
    if (this.isWebReadableStream(stream)) {
      return this.webStreamToBuffer(stream);
    } else if (this.isNodeReadableStream(stream)) {
      return this.nodeStreamToBuffer(stream);
    } else {
      throw new Error('Stream type not supported. Expected Web ReadableStream or Node.js Readable stream.');
    }
  }

  /**
   * Creates a web ReadableStream from a Buffer
   * @param buffer - Buffer to be converted
   * @returns Web ReadableStream
   */
  static fromBuffer(buffer: Buffer): ReadableStream<Uint8Array> {
    let position = 0;
    const chunkSize = 64 * 1024; // 64KB chunks

    return new ReadableStream<Uint8Array>({
      pull(controller) {
        if (position >= buffer.length) {
          controller.close();
          return;
        }

        const chunk = buffer.subarray(position, Math.min(position + chunkSize, buffer.length));
        const uint8Array = new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);

        controller.enqueue(uint8Array);
        position += chunk.length;
      }
    });
  }

  /**
   * Converts Node.js Readable stream to Web ReadableStream
   * Useful for HTTP requests (axios, fetch, etc)
   * @param nodeStream - Node.js Readable stream
   * @returns Web API ReadableStream
   */
  static nodeToWebStream(nodeStream: Readable): ReadableStream<Uint8Array> {
    return new ReadableStream<Uint8Array>({
      start(controller) {
        nodeStream.on('data', (chunk: Buffer) => {
          const uint8Array = new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
          controller.enqueue(uint8Array);
        });

        nodeStream.on('end', () => {
          controller.close();
        });

        nodeStream.on('error', (error) => {
          controller.error(error);
        });
      },

      cancel() {
        if (nodeStream.destroy) {
          nodeStream.destroy();
        }
      }
    });
  }
}
