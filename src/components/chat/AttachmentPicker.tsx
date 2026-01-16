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
        toast.error('File too large. Maximum size is 1MB.');
        return;
      }

      setIsLoading(true);
      try {
        let preview: string | undefined;

        // Generate preview for images
        if (type === 'image' && file.type.startsWith('image/')) {
          preview = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }

        onAttach({ file, preview, type });
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
          className="h-10 w-10 shrink-0"
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Paperclip className="h-5 w-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-48 p-2" align="start">
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => imageInputRef.current?.click()}
          >
            <Image className="h-4 w-4" />
            Photo
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <File className="h-4 w-4" />
            Document
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

// Preview component for pending attachment
interface AttachmentPreviewProps {
  attachment: AttachmentFile;
  onRemove: () => void;
}

export const AttachmentPreview = ({ attachment, onRemove }: AttachmentPreviewProps) => {
  return (
    <div className="relative inline-flex items-center gap-2 p-2 bg-secondary/50 rounded-lg max-w-xs">
      {attachment.preview ? (
        <img
          src={attachment.preview}
          alt="Preview"
          className="h-12 w-12 object-cover rounded"
        />
      ) : (
        <div className="h-12 w-12 bg-secondary rounded flex items-center justify-center">
          <File className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attachment.file.name}</p>
        <p className="text-xs text-muted-foreground">
          {(attachment.file.size / 1024).toFixed(1)} KB
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};
