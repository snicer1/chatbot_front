import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import type { Attachment } from '../../types';

interface MessageImagesProps {
  images: Attachment[];
  enableGallery: boolean;
}

export function MessageImages({ images, enableGallery }: MessageImagesProps) {
  const galleryRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<any>(null);

  useEffect(() => {
    if (!enableGallery || !galleryRef.current || typeof window === 'undefined') {
      return;
    }

    let destroyed = false;

    import('glightbox').then(({ default: GLightbox }) => {
      if (destroyed) return;

      // Destroy previous instance if exists
      if (lightboxRef.current) {
        lightboxRef.current.destroy();
      }

      // Build elements array from images (GLightbox expects objects, not DOM nodes)
      const elements = images.map((image) => ({
        href: image.url,
        type: 'image' as const,
        alt: image.filename || 'Image',
      }));

      // Create new instance with elements array
      lightboxRef.current = GLightbox({
        elements,
        touchNavigation: true,
        loop: true,
        autoplayVideos: false,
        closeOnOutsideClick: true,
      });

      // Attach click handlers to links
      const links = galleryRef.current!.querySelectorAll('.chat-image-item');
      links.forEach((link, index) => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          if (lightboxRef.current) {
            lightboxRef.current.openAt(index);
          }
        });
      });
    });

    return () => {
      destroyed = true;
      if (lightboxRef.current) {
        lightboxRef.current.destroy();
        lightboxRef.current = null;
      }
    };
  }, [enableGallery, images]);

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
