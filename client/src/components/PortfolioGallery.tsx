import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { X, Plus, Trash2, ChevronLeft, ChevronRight, GripVertical, Image as ImageIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UserPhoto } from "@shared/schema";

interface PortfolioGalleryProps {
  userId: string;
  isEditable?: boolean;
}

export function PortfolioGallery({ userId, isEditable = false }: PortfolioGalleryProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showAll, setShowAll] = useState(false);
  
  const MAX_VISIBLE_PHOTOS = 6;
  
  const { data: photos = [], isLoading } = useQuery<UserPhoto[]>({
    queryKey: ["/api/users", userId, "photos"],
    queryFn: () => fetch(`/api/users/${userId}/photos`).then(res => res.json()),
  });
  
  const addPhotoMutation = useMutation({
    mutationFn: async (data: { url: string; caption?: string }) => {
      return apiRequest("/api/photos", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "photos"] });
      toast({
        title: t("portfolio.photoAdded", "Photo added"),
        description: t("portfolio.photoAddedDesc", "Your photo has been added to your portfolio"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error", "Error"),
        description: t("portfolio.uploadError", "Failed to upload photo"),
        variant: "destructive",
      });
    },
  });
  
  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: string) => {
      return apiRequest(`/api/photos/${photoId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "photos"] });
      setSelectedPhotoIndex(null);
      toast({
        title: t("portfolio.photoDeleted", "Photo deleted"),
      });
    },
  });
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t("common.error", "Error"),
        description: t("portfolio.fileTooLarge", "File size must be less than 5MB"),
        variant: "destructive",
      });
      return;
    }
    
    setUploadingPhoto(true);
    
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await addPhotoMutation.mutateAsync({ url: base64 });
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingPhoto(false);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handlePrevPhoto = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };
  
  const handleNextPhoto = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2" data-testid="gallery-skeleton">
        {[1, 2, 3].map(i => (
          <div key={i} className="aspect-square rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ))}
      </div>
    );
  }
  
  if (photos.length === 0 && !isEditable) {
    return null;
  }
  
  const displayPhotos = showAll ? photos : photos.slice(0, MAX_VISIBLE_PHOTOS);
  const hasMorePhotos = photos.length > MAX_VISIBLE_PHOTOS;
  
  return (
    <div data-testid="gallery-portfolio">
      <div className="grid grid-cols-3 gap-2">
        {displayPhotos.map((photo, index) => (
          <motion.button
            key={photo.id}
            layoutId={`photo-${photo.id}`}
            onClick={() => setSelectedPhotoIndex(photos.indexOf(photo))}
            className="aspect-square rounded-2xl overflow-hidden relative group"
            whileTap={{ scale: 0.98 }}
            data-testid={`gallery-photo-${photo.id}`}
          >
            <img
              src={photo.url}
              alt={photo.caption || "Portfolio photo"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </motion.button>
        ))}
        
        {isEditable && (
          <motion.button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary hover:text-primary transition-colors"
            whileTap={{ scale: 0.98 }}
            data-testid="button-add-photo"
          >
            {uploadingPhoto ? (
              <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-6 h-6" />
                <span className="text-xs font-medium">{t("portfolio.addPhoto", "Add Photo")}</span>
              </>
            )}
          </motion.button>
        )}
      </div>
      
      {hasMorePhotos && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 text-center"
        >
          <Button
            variant="ghost"
            onClick={() => setShowAll(!showAll)}
            className="text-primary font-semibold text-sm"
            data-testid="button-view-all-photos"
          >
            {showAll 
              ? t("portfolio.showLess") 
              : t("portfolio.viewAll", { count: photos.length })}
          </Button>
        </motion.div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-photo-upload"
      />
      
      <AnimatePresence>
        {selectedPhotoIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col"
            onClick={() => setSelectedPhotoIndex(null)}
            data-testid="lightbox-overlay"
          >
            <div className="flex items-center justify-between p-4">
              <span className="text-white/60 text-sm">
                {selectedPhotoIndex + 1} / {photos.length}
              </span>
              <div className="flex items-center gap-2">
                {isEditable && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePhotoMutation.mutate(photos[selectedPhotoIndex].id);
                    }}
                    className="text-white hover:bg-white/10 rounded-xl"
                    data-testid="button-delete-photo"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedPhotoIndex(null)}
                  className="text-white hover:bg-white/10 rounded-xl"
                  data-testid="button-close-lightbox"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 flex items-center justify-center px-4 relative" onClick={(e) => e.stopPropagation()}>
              {selectedPhotoIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevPhoto();
                  }}
                  className="absolute left-4 text-white hover:bg-white/10 rounded-xl z-10"
                  data-testid="button-prev-photo"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
              )}
              
              <motion.img
                key={photos[selectedPhotoIndex].id}
                layoutId={`photo-${photos[selectedPhotoIndex].id}`}
                src={photos[selectedPhotoIndex].url}
                alt={photos[selectedPhotoIndex].caption || "Portfolio photo"}
                className="max-w-full max-h-[70vh] object-contain rounded-2xl"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              />
              
              {selectedPhotoIndex < photos.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextPhoto();
                  }}
                  className="absolute right-4 text-white hover:bg-white/10 rounded-xl z-10"
                  data-testid="button-next-photo"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              )}
            </div>
            
            {photos[selectedPhotoIndex].caption && (
              <div className="p-4 text-center text-white/80">
                {photos[selectedPhotoIndex].caption}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface PortfolioPreviewProps {
  userId: string;
  maxPhotos?: number;
}

export function PortfolioPreview({ userId, maxPhotos = 4 }: PortfolioPreviewProps) {
  const { data: photos = [] } = useQuery<UserPhoto[]>({
    queryKey: ["/api/users", userId, "photos"],
    queryFn: () => fetch(`/api/users/${userId}/photos`).then(res => res.json()),
  });
  
  if (photos.length === 0) return null;
  
  const displayPhotos = photos.slice(0, maxPhotos);
  const remainingCount = photos.length - maxPhotos;
  
  return (
    <div className="flex -space-x-2" data-testid="portfolio-preview">
      {displayPhotos.map((photo, index) => (
        <div
          key={photo.id}
          className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white dark:border-gray-900"
          style={{ zIndex: maxPhotos - index }}
        >
          <img
            src={photo.url}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <div 
          className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300"
          style={{ zIndex: 0 }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
