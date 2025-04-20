
import React from 'react';
import { Image, Trash } from 'lucide-react';

type Props = {
  url: string;
  onRemove: () => void;
};

const CourseThumbnail: React.FC<Props> = ({ url, onRemove }) => (
  <div className="flex flex-col items-center justify-center space-y-4">
    {url ? (
      <div className="relative">
        <img
          src={url}
          alt="Course thumbnail"
          className="h-48 w-full rounded-md object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://placehold.co/600x400?text=Invalid+Image+URL';
          }}
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-2 top-2 rounded-full bg-discord-deep-bg p-1 text-discord-secondary-text hover:text-discord-brand"
        >
          <Trash className="h-4 w-4" />
        </button>
      </div>
    ) : (
      <div className="flex h-48 w-full flex-col items-center justify-center rounded-md bg-discord-sidebar-bg">
        <Image className="mb-2 h-10 w-10 text-discord-secondary-text" />
        <p className="text-discord-secondary-text">No thumbnail set</p>
      </div>
    )}
  </div>
);

export default CourseThumbnail;
