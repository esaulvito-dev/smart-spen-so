import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface AvatarCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  onSave: (croppedBlob: Blob) => Promise<void>;
}

const PREVIEW_SIZE = 192; // Size of the preview circle in pixels
const OUTPUT_SIZE = 256; // Output image size

export function AvatarCropper({ open, onOpenChange, imageUrl, onSave }: AvatarCropperProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Reset state when dialog opens with new image
  useEffect(() => {
    if (open && imageUrl) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setImageLoaded(false);
    }
  }, [open, imageUrl]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    }
  }, [position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    imageRef.current = img;
    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    setImageLoaded(true);
  };

  // Calculate the base scale to fit image in preview (cover mode)
  const getBaseScale = useCallback(() => {
    if (!imageDimensions.width || !imageDimensions.height) return 1;
    
    const imageAspect = imageDimensions.width / imageDimensions.height;
    
    // Scale to cover the preview area
    if (imageAspect > 1) {
      // Image is wider than tall - scale based on height
      return PREVIEW_SIZE / imageDimensions.height;
    } else {
      // Image is taller than wide - scale based on width
      return PREVIEW_SIZE / imageDimensions.width;
    }
  }, [imageDimensions]);

  const handleSave = async () => {
    if (!canvasRef.current || !imageRef.current || !imageLoaded) return;
    
    setSaving(true);
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;

      const img = imageRef.current;
      const baseScale = getBaseScale();
      const totalScale = baseScale * zoom;
      
      // Calculate scaled dimensions
      const scaledWidth = img.naturalWidth * totalScale;
      const scaledHeight = img.naturalHeight * totalScale;
      
      // Scale factor from preview to output
      const outputScale = OUTPUT_SIZE / PREVIEW_SIZE;
      
      // Calculate position (centered + user offset)
      const centerX = (OUTPUT_SIZE - scaledWidth * outputScale) / 2 + (position.x * outputScale);
      const centerY = (OUTPUT_SIZE - scaledHeight * outputScale) / 2 + (position.y * outputScale);

      // Clear and clip to circle
      ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      ctx.beginPath();
      ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Draw the image
      ctx.drawImage(
        img, 
        centerX, 
        centerY, 
        scaledWidth * outputScale, 
        scaledHeight * outputScale
      );

      canvas.toBlob(async (blob) => {
        if (blob) {
          await onSave(blob);
          onOpenChange(false);
          setZoom(1);
          setPosition({ x: 0, y: 0 });
        }
      }, 'image/jpeg', 0.9);
    } finally {
      setSaving(false);
    }
  };

  // Calculate preview image styles
  const getPreviewStyles = useCallback(() => {
    if (!imageLoaded || !imageDimensions.width) {
      return { width: '100%', height: '100%' };
    }

    const baseScale = getBaseScale();
    const totalScale = baseScale * zoom;
    
    const width = imageDimensions.width * totalScale;
    const height = imageDimensions.height * totalScale;
    
    // Center the image
    const offsetX = (PREVIEW_SIZE - width) / 2 + position.x;
    const offsetY = (PREVIEW_SIZE - height) / 2 + position.y;

    return {
      width: `${width}px`,
      height: `${height}px`,
      left: `${offsetX}px`,
      top: `${offsetY}px`,
    };
  }, [imageLoaded, imageDimensions, zoom, position, getBaseScale]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar foto de perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview Area */}
          <div 
            className="relative mx-auto overflow-hidden cursor-move bg-muted"
            style={{
              width: PREVIEW_SIZE,
              height: PREVIEW_SIZE,
              borderRadius: '50%',
              border: '4px solid hsl(var(--primary) / 0.2)',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Preview"
                onLoad={handleImageLoad}
                className="absolute pointer-events-none select-none"
                style={getPreviewStyles()}
                draggable={false}
              />
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Arrastra para mover la imagen
          </p>

          {/* Zoom Controls */}
          <div className="flex items-center gap-4">
            <ZoomOut className="w-4 h-4 text-muted-foreground shrink-0" />
            <Slider
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              min={0.5}
              max={3}
              step={0.05}
              className="flex-1"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>

          {/* Reset Button */}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => {
              setZoom(1);
              setPosition({ x: 0, y: 0 });
            }}
          >
            <RotateCw className="w-4 h-4 mr-2" />
            Restablecer
          </Button>
        </div>

        {/* Hidden canvas for cropping */}
        <canvas ref={canvasRef} className="hidden" />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !imageLoaded}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
