import { useRef, useState, useCallback } from 'react';
import { Paperclip, Image, File, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';

// 1MB limit for inline attachments
const MAX_INLINE_SIZE = 1024 * 1024;

export interface AttachmentFile {
  file: File;
  preview?: string;
  type: 'image' | 'file';
  data?: Uint8Array;
}

interface AttachmentPickerProps {
  onAttach: (file: AttachmentFile) => void;
  disabled?: boolean;
}

export const AttachmentPicker = ({ onAttach, disabled }: AttachmentPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Check file size
      if (file.size > MAX_INLINE_SIZE) {
        toast.error('File too large. Maximum size is 1MB for now.');
        return;
      }

      setIsLoading(true);
      try {
        let preview: string | undefined;

        // Read file as array buffer for XMTP
        const arrayBuffer = await file.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);

        // Generate preview for images
        if (type === 'image' && file.type.startsWith('image/')) {
          preview = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }

        onAttach({ file, preview, type, data });
        setIsOpen(false);
      } catch (error) {
        console.error('Failed to process attachment:', error);
        toast.error('Failed to process file');
      } finally {
        setIsLoading(false);
        // Reset inputs
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (imageInputRef.current) imageInputRef.current.value = '';
      }
    },
    [onAttach]
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 touch-manipulation"
          disabled={disabled || isLoading}
          type="button"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Paperclip className="h-5 w-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        className="w-48 p-2" 
        align="start"
        sideOffset={8}
      >
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-12 touch-manipulation"
            onClick={() => imageInputRef.current?.click()}
            type="button"
          >
            <Image className="h-5 w-5" />
            <span className="text-base">Photo</span>
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-12 touch-manipulation"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <File className="h-5 w-5" />
            <span className="text-base">Document</span>
          </Button>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e, 'image')}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.csv,.json"
          className="hidden"
          onChange={(e) => handleFileSelect(e, 'file')}
        />
      </PopoverContent>
    </Popover>
  );
};

// Preview component for pending attachment (no separate send button - uses main send)
interface AttachmentPreviewProps {
  attachment: AttachmentFile;
  onRemove: () => void;
}

export const AttachmentPreview = ({ attachment, onRemove }: AttachmentPreviewProps) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
      <div className="relative flex items-center gap-2 flex-1 min-w-0">
        {attachment.preview ? (
          <img
            src={attachment.preview}
            alt="Preview"
            className="h-16 w-16 object-cover rounded-lg"
          />
        ) : (
          <div className="h-16 w-16 bg-secondary rounded-lg flex items-center justify-center shrink-0">
            <File className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{attachment.file.name}</p>
          <p className="text-xs text-muted-foreground">
            {(attachment.file.size / 1024).toFixed(1)} KB • Press send to share
          </p>
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 text-muted-foreground hover:text-destructive touch-manipulation shrink-0"
        onClick={onRemove}
        type="button"
      >
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
};
