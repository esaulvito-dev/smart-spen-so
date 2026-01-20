import { useState, useRef, useCallback } from 'react';
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

export function AvatarCropper({ open, onOpenChange, imageUrl, onSave }: AvatarCropperProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
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

  const handleSave = async () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    setSaving(true);
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = 256;
      canvas.width = size;
      canvas.height = size;

      const img = imageRef.current;
      const scale = zoom;
      const imgWidth = img.naturalWidth * scale;
      const imgHeight = img.naturalHeight * scale;
      
      // Center the image with applied position offset
      const centerX = (size - imgWidth) / 2 + position.x * (size / 200);
      const centerY = (size - imgHeight) / 2 + position.y * (size / 200);

      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      ctx.drawImage(img, centerX, centerY, imgWidth, imgHeight);

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

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    imageRef.current = e.currentTarget;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar foto de perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview Area */}
          <div 
            className="relative w-48 h-48 mx-auto rounded-full overflow-hidden border-4 border-primary/20 cursor-move bg-muted"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img
              src={imageUrl}
              alt="Preview"
              onLoad={handleImageLoad}
              className="absolute w-full h-full object-cover transition-transform"
              style={{
                transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              }}
              draggable={false}
            />
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Arrastra para mover la imagen
          </p>

          {/* Zoom Controls */}
          <div className="flex items-center gap-4">
            <ZoomOut className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              min={0.5}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground" />
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
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
