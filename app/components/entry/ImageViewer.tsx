import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useRef } from 'react';

interface ImageViewerProps {
  /** The full-size image to show; null keeps the viewer closed */
  src: string | null;
  /** What the picture is of (the entry's name) */
  alt: string;
  onClose: () => void;
}

/**
 * An entry's picture at full size, over the page.
 *
 * A real dialog: focus moves into it and stays there, Escape and the
 * backdrop close it, focus returns to the thumbnail that opened it, and a
 * screen reader hears what opened instead of reading on through the page
 * underneath. (It used to be a plain <div> that only a mouse could dismiss.)
 */
export function ImageViewer({ src, alt, onClose }: ImageViewerProps) {
  // Radix returns focus to a Dialog.Trigger; this dialog is opened by state
  // instead, so remember what had focus (the thumbnail) and hand it back
  const opener = useRef<HTMLElement | null>(null);

  return (
    <Dialog.Root open={src != null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* The content fills the window, so a click anywhere but the picture closes it */}
        <Dialog.Content
          className="image-modal"
          aria-describedby={undefined}
          onClick={onClose}
          onOpenAutoFocus={() => {
            opener.current = document.activeElement as HTMLElement | null;
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            opener.current?.focus();
          }}
        >
          <Dialog.Title className="sr-only">{alt}, full size</Dialog.Title>
          <Dialog.Close className="image-modal-close" aria-label="Close image">
            <X size={32} aria-hidden="true" />
          </Dialog.Close>
          {src && <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} />}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
