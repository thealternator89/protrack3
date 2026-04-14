
export class DescriptionService {
  /**
   * Processes a description string, stripping all Markdown and HTML images
   * and replacing them with a placeholder.
   */
  async processDescription(description: string | null | undefined): Promise<string | null> {
    const markdownImageRegex = /!\[.*?\]\(.*?\)/g;
    const htmlImageRegex = /<img[^>]*>/gi;
    const placeholder = '_[Stripped Image]_';

    return description?.replace(markdownImageRegex, placeholder).replace(htmlImageRegex, placeholder) ?? null;
  }
}

export const descriptionService = new DescriptionService();
