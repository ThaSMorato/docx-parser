import type { XmlRepository } from '../../domain/repositories';
import { DocxParseError } from '../../domain/types';

export class XmlAdapter implements XmlRepository {
  parseXml(xmlContent: string): globalThis.Document {
    // For now, we'll create a simple mock Document
    // In a real implementation, you'd use a proper XML parser like 'fast-xml-parser'
    console.log('XML content length:', xmlContent.length);
    throw new DocxParseError('XML parsing not implemented - use a proper XML parser library');
  }

  extractText(xmlDoc: globalThis.Document): string {
    console.log('XML doc:', xmlDoc);
    throw new DocxParseError('XML text extraction not implemented');
  }

  extractElements(xmlDoc: globalThis.Document, tagName: string): globalThis.Element[] {
    console.log('XML doc:', xmlDoc, 'Tag name:', tagName);
    throw new DocxParseError('XML element extraction not implemented');
  }

  // Simple regex-based text extraction for basic functionality
  extractTextFromXml(xmlContent: string): string {
    try {
      // Remove XML tags and extract text content
      const textContent = xmlContent
        .replace(/<[^>]*>/g, ' ') // Remove all XML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();

      return textContent;
    } catch (error) {
      throw new DocxParseError(
        `Failed to extract text from XML: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Extract paragraph content using regex
  extractParagraphsFromXml(xmlContent: string): string[] {
    try {
      const paragraphs: string[] = [];
      const paragraphRegex = /<w:p[^>]*>(.*?)<\/w:p>/gs;
      let match;

      while ((match = paragraphRegex.exec(xmlContent)) !== null) {
        const paragraphXml = match[1];
        if (paragraphXml) {
          const text = this.extractTextFromXml(paragraphXml);
          if (text.trim()) {
            paragraphs.push(text);
          }
        }
      }

      return paragraphs;
    } catch (error) {
      throw new DocxParseError(
        `Failed to extract paragraphs: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Extract paragraphs with style information to detect headers
  extractParagraphsWithStyleFromXml(xmlContent: string): Array<{ text: string; type: 'paragraph' | 'header'; level?: number }> {
    try {
      const elements: Array<{ text: string; type: 'paragraph' | 'header'; level?: number }> = [];
      const paragraphRegex = /<w:p[^>]*>(.*?)<\/w:p>/gs;
      let match;

      while ((match = paragraphRegex.exec(xmlContent)) !== null) {
        const paragraphXml = match[1];
        if (paragraphXml) {
          const text = this.extractTextFromXml(paragraphXml);
          if (text.trim()) {
            // Check if it's a header based on style or formatting
            const styleInfo = this.analyzeStyleForHeader(paragraphXml);
            const element: { text: string; type: 'paragraph' | 'header'; level?: number } = {
              text: text.trim(),
              type: styleInfo.isHeader ? 'header' : 'paragraph'
            };

            if (styleInfo.level !== undefined) {
              element.level = styleInfo.level;
            }

            elements.push(element);
          }
        }
      }

      return elements;
    } catch (error) {
      throw new DocxParseError(
        `Failed to extract paragraphs with style: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Extract paragraphs with formatting information (including strike for checkboxes)
  extractParagraphsWithFormattingFromXml(xmlContent: string): Array<{
    text: string;
    type: 'paragraph' | 'header';
    level?: number;
    formatting?: {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      strike?: boolean; // For checked checkboxes
    };
  }> {
    try {
      const elements: Array<{
        text: string;
        type: 'paragraph' | 'header';
        level?: number;
        formatting?: {
          bold?: boolean;
          italic?: boolean;
          underline?: boolean;
          strike?: boolean;
        };
      }> = [];
      const paragraphRegex = /<w:p[^>]*>(.*?)<\/w:p>/gs;
      let match;

      while ((match = paragraphRegex.exec(xmlContent)) !== null) {
        const paragraphXml = match[1];
        if (paragraphXml) {
          const text = this.extractTextFromXml(paragraphXml);
          if (text.trim()) {
            // Check if it's a header based on style or formatting
            const styleInfo = this.analyzeStyleForHeader(paragraphXml);
            const formattingInfo = this.extractFormattingInfo(paragraphXml);

            const element: {
              text: string;
              type: 'paragraph' | 'header';
              level?: number;
              formatting?: {
                bold?: boolean;
                italic?: boolean;
                underline?: boolean;
                strike?: boolean;
              };
            } = {
              text: text.trim(),
              type: styleInfo.isHeader ? 'header' : 'paragraph'
            };

            if (styleInfo.level !== undefined) {
              element.level = styleInfo.level;
            }

            if (Object.keys(formattingInfo).length > 0) {
              element.formatting = formattingInfo;
            }

            elements.push(element);
          }
        }
      }

      return elements;
    } catch (error) {
      throw new DocxParseError(
        `Failed to extract paragraphs with formatting: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Extract formatting information from paragraph XML
  private extractFormattingInfo(paragraphXml: string): {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strike?: boolean;
  } {
    const formatting: {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      strike?: boolean;
    } = {};

    // Check for bold
    if (/<w:b\b[^>]*\/?>/.test(paragraphXml)) {
      formatting.bold = true;
    }

    // Check for italic
    if (/<w:i\b[^>]*\/?>/.test(paragraphXml)) {
      formatting.italic = true;
    }

    // Check for underline
    if (/<w:u\b[^>]*\/?>/.test(paragraphXml)) {
      formatting.underline = true;
    }

    // Check for strike (indicates checked checkbox)
    if (/<w:strike\s+w:val=["']1["'][^>]*\/?>/.test(paragraphXml)) {
      formatting.strike = true;
    }

    return formatting;
  }

  // Analyze paragraph style to determine if it's a header
  private analyzeStyleForHeader(paragraphXml: string): { isHeader: boolean; level?: number } {
    // Check for heading styles (w:pStyle with heading values)
    const headingStyleRegex = /<w:pStyle[^>]*w:val=["']([^"']*heading[^"']*)["'][^>]*>/i;
    const headingMatch = paragraphXml.match(headingStyleRegex);

    if (headingMatch && headingMatch[1]) {
      const style = headingMatch[1].toLowerCase();
      const levelMatch = style.match(/heading(\d+)|h(\d+)/);
      const level = levelMatch ? parseInt(levelMatch[1] || levelMatch[2] || '1') : 1;
      return { isHeader: true, level };
    }

    // Check for Title style
    const titleStyleRegex = /<w:pStyle[^>]*w:val=["']([^"']*title[^"']*)["'][^>]*>/i;
    if (titleStyleRegex.test(paragraphXml)) {
      return { isHeader: true, level: 1 };
    }

    // Check for subtitle style
    const subtitleStyleRegex = /<w:pStyle[^>]*w:val=["']([^"']*subtitle[^"']*)["'][^>]*>/i;
    if (subtitleStyleRegex.test(paragraphXml)) {
      return { isHeader: true, level: 2 };
    }

    // For now, we'll be very conservative and only detect explicitly styled headers
    // No heuristics - only official Word styles are detected as headers
    return { isHeader: false };
  }

  // Extract table content using regex
  extractTablesFromXml(xmlContent: string): Array<{ rows: Array<{ cells: string[] }> }> {
    try {
      const tables: Array<{ rows: Array<{ cells: string[] }> }> = [];
      const tableRegex = /<w:tbl[^>]*>(.*?)<\/w:tbl>/gs;
      let tableMatch;

      while ((tableMatch = tableRegex.exec(xmlContent)) !== null) {
        const tableXml = tableMatch[1];
        if (!tableXml) continue;

        const rows: Array<{ cells: string[] }> = [];

        const rowRegex = /<w:tr[^>]*>(.*?)<\/w:tr>/gs;
        let rowMatch;

        while ((rowMatch = rowRegex.exec(tableXml)) !== null) {
          const rowXml = rowMatch[1];
          if (!rowXml) continue;

          const cells: string[] = [];

          const cellRegex = /<w:tc[^>]*>(.*?)<\/w:tc>/gs;
          let cellMatch;

          while ((cellMatch = cellRegex.exec(rowXml)) !== null) {
            const cellXml = cellMatch[1];
            if (cellXml) {
              const cellText = this.extractTextFromXml(cellXml);
              cells.push(cellText);
            }
          }

          if (cells.length > 0) {
            rows.push({ cells });
          }
        }

        if (rows.length > 0) {
          tables.push({ rows });
        }
      }

      return tables;
    } catch (error) {
      throw new DocxParseError(
        `Failed to extract tables: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Extract header content from XML
  extractHeaderFromXml(xmlContent: string): { text: string; hasPageNumber: boolean; watermark?: string } | null {
    try {
      const textContent = this.extractTextFromXml(xmlContent);

      // Check for PAGE field (page number)
      const hasPageNumber = /<w:instrText[^>]*>PAGE<\/w:instrText>/.test(xmlContent);

      // Check for watermark - more flexible pattern
      const watermarkMatch = xmlContent.match(/string="([^"]*)"[^>]*>.*?<v:textpath/) ||
                           xmlContent.match(/string="([^"]*)".*?fitshape="t"/);
      const watermark = watermarkMatch ? watermarkMatch[1] : undefined;

      if (textContent.trim() || hasPageNumber || watermark) {
        const result: { text: string; hasPageNumber: boolean; watermark?: string } = {
          text: textContent.trim(),
          hasPageNumber
        };

        if (watermark) {
          result.watermark = watermark;
        }

        return result;
      }

      return null;
    } catch (error) {
      throw new DocxParseError(
        `Failed to extract header: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Extract footer content from XML
  extractFooterFromXml(xmlContent: string): { text: string; hasPageNumber: boolean } | null {
    try {
      const textContent = this.extractTextFromXml(xmlContent);

      // Check for PAGE field (page number)
      const hasPageNumber = /<w:instrText[^>]*>PAGE<\/w:instrText>/.test(xmlContent);

      if (textContent.trim() || hasPageNumber) {
        return {
          text: textContent.trim(),
          hasPageNumber
        };
      }

      return null;
    } catch (error) {
      throw new DocxParseError(
        `Failed to extract footer: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Extract footnotes from XML
  extractFootnotesFromXml(xmlContent: string): Array<{ id: string; text: string }> {
    try {
      const footnotes: Array<{ id: string; text: string }> = [];
      const footnoteRegex = /<w:footnote[^>]*w:id="([^"]*)"[^>]*>(.*?)<\/w:footnote>/gs;
      let match;

      while ((match = footnoteRegex.exec(xmlContent)) !== null) {
        const id = match[1];
        const footnoteXml = match[2];

        if (id && footnoteXml && id !== "0") { // Skip the default footnote with id="0"
          const text = this.extractTextFromXml(footnoteXml);
          if (text.trim()) {
            footnotes.push({
              id,
              text: text.trim()
            });
          }
        } else if (id === "0" && footnoteXml) {
          // Special handling for the default footnote
          const text = this.extractTextFromXml(footnoteXml);
          if (text.trim()) {
            footnotes.push({
              id,
              text: text.trim()
            });
          }
        }
      }

      return footnotes;
    } catch (error) {
      throw new DocxParseError(
        `Failed to extract footnotes: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
