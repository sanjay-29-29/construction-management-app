import {
  AlertDialog,
  AlertDialogDescription,
} from '@radix-ui/react-alert-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Edit, Loader2, Save, UploadCloud, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { client } from '@/axios';
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { Order } from '@/types';

interface ImageFile {
  file: File;
  preview: string;
}

export const OrderImage = ({ order }: { order?: Order }) => {
  const queryClient = useQueryClient();

  const [images, setImages] = useState<ImageFile[]>([]);
  const [isEditable, setIsEditable] = useState<boolean>(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // --- MUTATIONS ---

  const uploadImagesMutation = useMutation({
    mutationFn: async (newImages: ImageFile[]) => {
      const formData = new FormData();
      newImages.forEach((img) => {
        formData.append('images', img.file);
      });
      await client.post(`orders/${order?.id}/images/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      toast.success('Images uploaded successfully');
      setImages([]);
      setIsEditable(false);
      queryClient.invalidateQueries({ queryKey: ['orders', order?.id] });
    },
    onError: (error) => {
      toast.error('Failed to upload images');
      console.log(error);
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      await client.delete(`orders/${order?.id}/images/${imageId}/`);
    },
    onSuccess: () => {
      toast.success('Image deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['orders', order?.id] });
      setImageToDelete(null);
    },
    onError: (error) => {
      console.error(error);
      toast.error('Failed to delete image');
    },
  });

  // --- HANDLERS ---

  const handleUploadSave = () => {
    if (images.length === 0) return;
    uploadImagesMutation.mutate(images);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const newImages: ImageFile[] = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const targetImage = prev[index];
      if (targetImage) {
        URL.revokeObjectURL(targetImage.preview as string);
      }
      return prev.filter((_, i) => i !== index);
    });

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleCancel = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const confirmDelete = () => {
    if (imageToDelete) {
      deleteImageMutation.mutate(imageToDelete);
    }
  };

  // boolean
  const isEditEnabled = order?.isCompleted === false;

  return (
    <div className="space-y-4">
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Images</h3>
        {!isEditable && isEditEnabled && (
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => setIsEditable(true)}
          >
            <span>
              <Edit className="h-4 w-4 mr-2" />
            </span>
            Edit
          </Button>
        )}

        {/* If upload is open, show Save/Cancel buttons here for cleaner UI */}
        {isEditable && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-red-200 border text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => {
                handleCancel();
                setIsEditable(false);
              }}
              disabled={uploadImagesMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleUploadSave}
              disabled={images.length === 0 || uploadImagesMutation.isPending}
            >
              {uploadImagesMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        )}
      </div>
      {/* --- 1. EXISTING IMAGES GRID --- */}
      {order?.images && order.images.length > 0 ? (
        // Adjusted grid cols for narrower portrait images
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-9 gap-4">
          {order.images.map((img) => (
            <div
              key={img.id}
              // Changed aspect-video to aspect-[3/4] for portrait
              className="relative group border rounded-lg overflow-hidden aspect-[3/4] bg-gray-100"
            >
              <img
                src={img.image}
                alt="Order attachment"
                className="w-full h-full object-cover"
                onClick={() => window.open(img.image, '_blank')}
              />
              {isEditable && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="absolute top-1 right-1 h-7 w-7 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                  onClick={() => setImageToDelete(img.id)}
                >
                  <X size={14} />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        !isEditable && (
          <div className="text-center text-muted-foreground mb-28">
            No images found.
          </div>
        )
      )}
      {isEditable && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
            onClick={() => inputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2">
              <UploadCloud className="h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-600">
                Click to upload or drag & drop images
              </p>
              <p className="text-xs text-gray-400 mt-1">
                PNG, JPG, JPEG supported
              </p>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Preview of NEW images */}
          {images.length > 0 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {images.map((img, index) => (
                <div
                  key={index}
                  // Adjusted Width (w-40) and Aspect Ratio (aspect-[3/4]) for portrait previews
                  className="relative group border rounded-lg overflow-hidden w-40 shrink-0 aspect-[3/4]"
                >
                  <img
                    src={img.preview}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="absolute top-1 right-1 h-7 w-7 text-red-500 border-red-200 hover:bg-red-50hover:text-red-600"
                    onClick={() => removeImage(index)}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <AlertDialog
        open={!!imageToDelete}
        onOpenChange={(open) => !open && setImageToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogDescription>
              Are you sure you want to delete this image? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteImageMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteImageMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
            >
              {deleteImageMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
