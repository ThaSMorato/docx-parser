import JSZip from 'jszip';

import type { ZipRepository } from '../../domain/repositories';
import { DocxParseError } from '../../domain/types';

export class ZipAdapter implements ZipRepository {
  async extractFile(buffer: Buffer, filename: string): Promise<Buffer | null> {
    try {
      const zip = new JSZip();
      const zipData = await zip.loadAsync(buffer);

      const file = zipData.file(filename);
      if (!file) {
        return null;
      }

      const content = await file.async('uint8array');
      return Buffer.from(content);
    } catch (error) {
      throw new DocxParseError(
        `Failed to extract file ${filename}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async extractFiles(buffer: Buffer, pattern: RegExp): Promise<Map<string, Buffer>> {
    try {
      const zip = new JSZip();
      const zipData = await zip.loadAsync(buffer);

      const files = new Map<string, Buffer>();

      for (const [filename, file] of Object.entries(zipData.files)) {
        if (file && !file.dir && pattern.test(filename)) {
          const content = await file.async('uint8array');
          files.set(filename, Buffer.from(content));
        }
      }

      return files;
    } catch (error) {
      throw new DocxParseError(
        `Failed to extract files with pattern ${pattern}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
