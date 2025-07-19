import { useState, useRef, useEffect } from "react";
import { Upload, Camera, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface PhotoUploadProps {
  onPhotoSelect: (file: File, imageUrl: string) => void;
}

export const PhotoUpload = ({ onPhotoSelect }: PhotoUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  // [1] Add onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);

  // [2] Downscale large images on upload
  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }
    // Downscale if needed
    const img = new window.Image();
    img.src = URL.createObjectURL(file);
    await new Promise((resolve) => { img.onload = resolve; });
    const maxDim = 1600;
    let { width, height } = img;
    if (width > maxDim || height > maxDim) {
      const scale = Math.min(maxDim / width, maxDim / height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, file.type));
      if (blob) {
        const downscaledFile = new File([blob], file.name, { type: file.type });
        const imageUrl = URL.createObjectURL(downscaledFile);
        onPhotoSelect(downscaledFile, imageUrl);
        return;
      }
    }
    const imageUrl = URL.createObjectURL(file);
    onPhotoSelect(file, imageUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const capturePhoto = () => {
    // For now, just open file dialog with camera preference
    const input = fileInputRef.current;
    if (input) {
      input.accept = "image/*";
      input.capture = "environment";
      input.click();
    }
  };

  // [4] Show onboarding if first time user
  useEffect(() => {
    if (!localStorage.getItem('hasSeenPhotoUploadOnboarding')) {
      setShowOnboarding(true);
      localStorage.setItem('hasSeenPhotoUploadOnboarding', 'true');
    }
  }, []);

  return (
    <Card 
      className={`relative p-8 border-2 border-dashed transition-all duration-200 ${
        isDragOver 
          ? 'border-primary bg-primary/5' 
          : 'border-photo-border hover:border-primary/50'
      }`}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
    >
      <div className="flex flex-col items-center justify-center space-y-6 text-center">
        <div className="p-4 rounded-full bg-gradient-primary shadow-soft">
          <ImageIcon className="h-8 w-8 text-primary-foreground" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold">Upload Your Room Photo</h3>
          <p className="text-muted-foreground max-w-md">
            Take or upload a photo of your space to start visualizing how products will look
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Button 
            onClick={openFileDialog}
            className="flex-1 h-12"
            variant="default"
            aria-label="Upload photo"
            title="Upload photo"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Photo
          </Button>
          
          <Button 
            onClick={capturePhoto}
            variant="outline"
            className="flex-1 h-12"
            aria-label="Take photo"
            title="Take photo"
          >
            <Camera className="mr-2 h-4 w-4" />
            Take Photo
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Supports JPG, PNG, WebP up to 10MB
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />
    </Card>
  );
};