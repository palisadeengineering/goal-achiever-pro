'use client';

import { useCallback, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ImagePlus, Trash2, Star, StarOff, Upload } from 'lucide-react';
import type { VisionWizardData } from '../vision-wizard';

interface VisionBoardStepProps {
  data: VisionWizardData;
  updateData: (updates: Partial<VisionWizardData>) => void;
}

export function VisionBoardStep({ data, updateData }: VisionBoardStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;

      const newImages = Array.from(files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
        caption: '',
        isCover: data.boardImages.length === 0, // First image is cover by default
      }));

      updateData({
        boardImages: [...data.boardImages, ...newImages],
      });

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [data.boardImages, updateData]
  );

  const removeImage = useCallback(
    (index: number) => {
      const newImages = data.boardImages.filter((_, i) => i !== index);
      // If removing cover, make first remaining image the cover
      if (data.boardImages[index].isCover && newImages.length > 0) {
        newImages[0] = { ...newImages[0], isCover: true };
      }
      updateData({ boardImages: newImages });
    },
    [data.boardImages, updateData]
  );

  const setCoverImage = useCallback(
    (index: number) => {
      updateData({
        boardImages: data.boardImages.map((img, i) => ({
          ...img,
          isCover: i === index,
        })),
      });
    },
    [data.boardImages, updateData]
  );

  const updateCaption = useCallback(
    (index: number, caption: string) => {
      updateData({
        boardImages: data.boardImages.map((img, i) =>
          i === index ? { ...img, caption } : img
        ),
      });
    },
    [data.boardImages, updateData]
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          Add inspiring images to your vision board. These visuals will help reinforce
          your vision every time you review it.
        </p>
        <p className="text-sm font-medium mt-2">
          {data.boardImages.length} image{data.boardImages.length !== 1 ? 's' : ''} added
        </p>
      </div>

      {/* Upload Area */}
      <div
        className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          <div className="p-4 bg-primary/10 rounded-full">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div>
            <p className="font-medium">Click to upload images</p>
            <p className="text-sm text-muted-foreground">
              PNG, JPG, GIF up to 10MB each
            </p>
          </div>
        </div>
      </div>

      {/* Image Grid */}
      {data.boardImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {data.boardImages.map((image, index) => (
            <Card key={index} className={image.isCover ? 'ring-2 ring-primary' : ''}>
              <CardContent className="p-3">
                <div className="relative aspect-video mb-2">
                  <img
                    src={image.preview}
                    alt={`Vision board image ${index + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                  {image.isCover && (
                    <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                      Cover
                    </div>
                  )}
                </div>
                <Input
                  placeholder="Add a caption..."
                  value={image.caption || ''}
                  onChange={(e) => updateCaption(index, e.target.value)}
                  className="text-sm mb-2"
                />
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCoverImage(index)}
                    disabled={image.isCover}
                  >
                    {image.isCover ? (
                      <Star className="h-4 w-4 mr-1 fill-yellow-500 text-yellow-500" />
                    ) : (
                      <StarOff className="h-4 w-4 mr-1" />
                    )}
                    {image.isCover ? 'Cover' : 'Set Cover'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeImage(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add More Button */}
          <Card
            className="border-dashed cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <CardContent className="p-3 h-full flex items-center justify-center aspect-video">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <ImagePlus className="h-8 w-8" />
                <span className="text-sm">Add More</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tips */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Vision Board Tips</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>• Include images of your desired outcomes (home, car, lifestyle)</li>
          <li>• Add photos of role models or mentors who inspire you</li>
          <li>• Use images that evoke strong positive emotions</li>
          <li>• The cover image will be shown in summaries and wallpapers</li>
        </ul>
      </div>
    </div>
  );
}
