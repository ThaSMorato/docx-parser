import type { ReadStream } from 'node:fs';
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
   * Converte ReadableStream da web para Buffer
   * @param stream - ReadableStream da web
   * @returns Promise que resolve para Buffer
   */
  static async toBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
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
}
