/**
 * XMTP Content Type Codecs
 * This module sets up all the content type codecs for XMTP messaging features.
 */

import { ContentTypeReaction, ReactionCodec, type Reaction } from '@xmtp/content-type-reaction';
import { ContentTypeRemoteAttachment, RemoteAttachmentCodec, type RemoteAttachment } from '@xmtp/content-type-remote-attachment';
import { ContentTypeReply, ReplyCodec, type Reply } from '@xmtp/content-type-reply';
import { ContentTypeText } from '@xmtp/content-type-text';

// Re-export types and content types
export { ContentTypeReaction, ContentTypeRemoteAttachment, ContentTypeReply, ContentTypeText };
export type { Reaction, RemoteAttachment, Reply };

// Codec instances for registration
export const reactionCodec = new ReactionCodec();
export const remoteAttachmentCodec = new RemoteAttachmentCodec();
export const replyCodec = new ReplyCodec();

/**
 * Create a reaction payload for XMTP
 */
export function createReaction(
  referenceMessageId: string,
  emoji: string,
  action: 'added' | 'removed'
): Reaction {
  return {
    reference: referenceMessageId,
    action,
    content: emoji,
    schema: 'unicode',
  };
}

/**
 * Create a reply payload for XMTP browser-sdk v5
 * The Reply type requires: reference, content, and contentType
 */
export function createReply(
  referenceMessageId: string,
  replyContent: string
): Reply {
  return {
    reference: referenceMessageId,
    content: replyContent,
    contentType: ContentTypeText,
  };
}

/**
 * Check if content is a reaction
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isReactionContent(content: any): content is Reaction {
  return (
    content &&
    typeof content === 'object' &&
    'reference' in content &&
    'action' in content &&
    'content' in content &&
    (content.action === 'added' || content.action === 'removed')
  );
}

/**
 * Check if content is a reply
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isReplyContent(content: any): content is Reply {
  return (
    content &&
    typeof content === 'object' &&
    'reference' in content &&
    'content' in content &&
    !('action' in content)
  );
}

/**
 * Check if content is a remote attachment
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isRemoteAttachmentContent(content: any): content is RemoteAttachment {
  return (
    content &&
    typeof content === 'object' &&
    'url' in content &&
    'contentDigest' in content
  );
}
