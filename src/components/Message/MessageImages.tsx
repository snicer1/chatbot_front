import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import type { Attachment } from '../../types';

interface MessageImagesProps {
  images: Attachment[];
  enableGallery: boolean;
}

export function MessageImages({ images, enableGallery }: MessageImagesProps) {
  const galleryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (enableGallery && galleryRef.current && typeof window !== 'undefined') {
      import('glightbox').then(({ default: GLightbox }) => {
        GLightbox({
          selector: '.chat-image-item',
          touchNavigation: true,
          loop: true,
          autoplayVideos: false
        });
      });
    }
  }, [enableGallery]);

  if (images.length === 0) return null;

  return (
    <div
      ref={galleryRef}
      class={`chat-message-images chat-message-images-${images.length > 1 ? 'grid' : 'single'}`}
    >
      {images.map((image) => (
        <a
          key={image.id}
          href={image.url}
          class="chat-image-item"
          data-gallery="message-gallery"
        >
          <img
            src={image.thumbnailUrl || image.url}
            alt={image.filename || 'Image'}
            loading="lazy"
          />
        </a>
      ))}
    </div>
  );
}
