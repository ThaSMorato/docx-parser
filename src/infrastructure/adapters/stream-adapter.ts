import type { ReadStream } from 'node:fs';
import type { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';

/**
 * StreamAdapter - Classe para converter ReadStream normal para ReadableStream da web
 */
export class StreamAdapter {
  /**
   * Converte um ReadStream do Node.js para ReadableStream da web
   * @param readStream - Stream de leitura do Node.js (fs.ReadStream)
   * @returns ReadableStream da web API
   */
  static toWebStream(readStream: ReadStream): ReadableStream<Uint8Array> {
    return new ReadableStream<Uint8Array>({
      start(controller) {
        readStream.on('data', (chunk: string | Buffer) => {
          // Converte Buffer para Uint8Array de forma eficiente
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
        // Limpa o stream se cancelado
        readStream.destroy();
      }
    });
  }

  /**
   * Verifica se é um Web ReadableStream
   */
  private static isWebReadableStream(stream: any): stream is ReadableStream<Uint8Array> {
    return stream && typeof stream.getReader === 'function';
  }

  /**
   * Verifica se é um Node.js Readable stream
   */
  private static isNodeReadableStream(stream: any): stream is Readable {
    return stream && typeof stream.read === 'function' && typeof stream.on === 'function';
  }

  /**
   * Converte Node.js Readable stream para Buffer
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
   * Converte Web ReadableStream para Buffer
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
   * Converte ReadableStream (Web ou Node.js) para Buffer
   * Detecta automaticamente o tipo de stream e usa a conversão apropriada
   * @param stream - ReadableStream da web ou Node.js Readable stream
   * @returns Promise que resolve para Buffer
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
   * Cria um ReadableStream da web a partir de um Buffer
   * @param buffer - Buffer a ser convertido
   * @returns ReadableStream da web
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
   * Converte Node.js Readable stream para Web ReadableStream
   * Útil para requisições HTTP (axios, fetch, etc)
   * @param nodeStream - Node.js Readable stream
   * @returns ReadableStream da web API
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
