export interface GalleryPhoto {
  id: string;
  url: string;
  alt: string;
}

export function ProfileGallery({ photos }: { photos: GalleryPhoto[] }) {
  if (photos.length === 0) {
    return (
      <div className="rounded-xl bg-surface-container-lowest p-8 text-center text-on-surface-variant shadow-sm">
        No photos yet. Add one next time you log or edit an activity.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
      {photos.map((photo) => (
        <div key={photo.id} className="aspect-square overflow-hidden rounded-lg bg-surface-container">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt={photo.alt} className="h-full w-full object-cover" />
        </div>
      ))}
    </div>
  );
}
