import i18n from '@/i18n';

const STREAMING_IMAGE_PLACEHOLDER = '<span class="streaming-image-loading"><span class="streaming-image-loading__skeleton"></span></span>';

export const replaceIncompleteImageWithPlaceholder = (content: string): string => {
  if (!content) return '';

  const lastImgStart = content.lastIndexOf('![');
  if (lastImgStart < 0) return content;

  const tail = content.slice(lastImgStart);
  const hasImageOpen = tail.startsWith('![');
  const hasBracketClose = tail.includes(']');
  const hasParenOpen = tail.includes('(');
  const hasParenClose = tail.includes(')');
  if (!hasImageOpen) return content;

  // Incomplete image syntax at stream tail, e.g. ![alt](local://...
  if (!hasBracketClose || (hasParenOpen && !hasParenClose)) {
    return content.slice(0, lastImgStart) + STREAMING_IMAGE_PLACEHOLDER;
  }

  return content;
};

export const formatManualTitle = (question?: string): string => {
  if (!question) {
    return i18n.global.t('chat.sessionExcerpt');
  }
  const condensed = question.replace(/\s+/g, ' ').trim();
  if (!condensed) {
    return i18n.global.t('chat.sessionExcerpt');
  }
  return condensed.length > 40 ? `${condensed.slice(0, 40)}...` : condensed;
};

export const buildManualMarkdown = (_question: string, answer: string): string => {
  const safeAnswer = answer?.trim() || i18n.global.t('chat.noAnswerContent');
  return `${safeAnswer}`;
};

export const copyTextToClipboard = async (content: string): Promise<void> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(content);
      return;
    }
  } catch {
    // Fall through to the legacy copy path for non-secure HTTP origins.
  }

  const textArea = document.createElement('textarea');
  textArea.value = content;
  textArea.style.position = 'fixed';
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.opacity = '0';
  textArea.setAttribute('readonly', '');
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textArea);
  if (!copied) {
    throw new Error('Copy command failed');
  }
};
