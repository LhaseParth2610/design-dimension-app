import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Image as FabricImage, Rect } from "fabric";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RotateCcw, Download, Undo, Redo, Move } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Product } from "./ProductCatalog";

interface VisualizationCanvasProps {
  photoUrl: string;
  selectedProduct?: Product;
  onCalibrationStart: () => void;
}

export const VisualizationCanvas = ({ 
  photoUrl, 
  selectedProduct,
  onCalibrationStart 
}: VisualizationCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [opacity, setOpacity] = useState([80]);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const { toast } = useToast();

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: "#ffffff",
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  // Load background photo
  useEffect(() => {
    if (!fabricCanvas || !photoUrl) return;

    FabricImage.fromURL(photoUrl, { crossOrigin: 'anonymous' })
      .then((img) => {
        // Scale image to fit canvas while maintaining aspect ratio
        const canvasWidth = fabricCanvas.width!;
        const canvasHeight = fabricCanvas.height!;
        
        const scale = Math.min(
          canvasWidth / img.width!,
          canvasHeight / img.height!
        );
        
        img.set({
          left: (canvasWidth - img.width! * scale) / 2,
          top: (canvasHeight - img.height! * scale) / 2,
          scaleX: scale,
          scaleY: scale,
          selectable: false,
          evented: false,
        });

        fabricCanvas.clear();
        fabricCanvas.add(img);
        fabricCanvas.sendObjectToBack(img);
        fabricCanvas.renderAll();
      })
      .catch((error) => {
        console.error('Error loading image:', error);
        toast({
          title: "Error loading image",
          description: "Failed to load the photo. Please try again.",
          variant: "destructive"
        });
      });
  }, [fabricCanvas, photoUrl, toast]);

  // Add product overlay
  useEffect(() => {
    if (!fabricCanvas || !selectedProduct || !isCalibrated) return;

    // For now, create a placeholder rectangle for the product
    // In a real implementation, this would use the actual product image
    const rect = new Rect({
      left: 100,
      top: 100,
      fill: 'rgba(59, 130, 246, 0.8)', // Primary color with transparency
      width: selectedProduct.dimensions.width * 2, // Scale factor for demo
      height: selectedProduct.dimensions.height * 2,
      stroke: 'hsl(214, 84%, 56%)',
      strokeWidth: 2,
      cornerColor: 'hsl(214, 84%, 56%)',
      cornerSize: 8,
      transparentCorners: false,
    });

    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
    fabricCanvas.renderAll();

    toast({
      title: "Product added",
      description: `${selectedProduct.name} has been added to your photo. Drag to position it.`
    });
  }, [fabricCanvas, selectedProduct, isCalibrated, toast]);

  // Handle opacity change
  const handleOpacityChange = (value: number[]) => {
    setOpacity(value);
    
    if (!fabricCanvas) return;
    
    const activeObject = fabricCanvas.getActiveObject();
    if (activeObject) {
      activeObject.set('opacity', value[0] / 100);
      fabricCanvas.renderAll();
    }
  };

  const handleCalibration = () => {
    setIsCalibrated(true);
    onCalibrationStart();
    toast({
      title: "Calibration enabled",
      description: "Draw a line over a known object to set the scale."
    });
  };

  const handleDownload = () => {
    if (!fabricCanvas) return;
    
    const dataURL = fabricCanvas.toDataURL({
      format: 'png',
      quality: 0.9,
      multiplier: 1,
    });
    
    const link = document.createElement('a');
    link.download = 'room-visualization.png';
    link.href = dataURL;
    link.click();
    
    toast({
      title: "Downloaded",
      description: "Your visualization has been saved."
    });
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Visualization Canvas</h3>
        
        <div className="flex items-center gap-2">
          {!isCalibrated && (
            <Button 
              onClick={handleCalibration}
              variant="outline"
              size="sm"
            >
              <Move className="mr-2 h-4 w-4" />
              Calibrate Scale
            </Button>
          )}
          
          <Button onClick={handleDownload} size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>

      <div className="bg-canvas-bg rounded-lg p-4 border border-photo-border">
        <canvas 
          ref={canvasRef}
          className="max-w-full h-auto border border-photo-border rounded shadow-overlay"
        />
      </div>

      {selectedProduct && isCalibrated && (
        <div className="space-y-4 p-4 bg-gradient-subtle rounded-lg border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overlay Opacity</span>
            <span className="text-sm text-muted-foreground">{opacity[0]}%</span>
          </div>
          
          <Slider
            value={opacity}
            onValueChange={handleOpacityChange}
            max={100}
            min={10}
            step={5}
            className="w-full"
          />
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Selected: {selectedProduct.name}</span>
            <span>•</span>
            <span>{selectedProduct.dimensions.width} × {selectedProduct.dimensions.height} cm</span>
          </div>
        </div>
      )}

      {!isCalibrated && selectedProduct && (
        <div className="p-4 bg-secondary/50 rounded-lg border border-dashed border-primary/30">
          <p className="text-sm text-muted-foreground text-center">
            Please calibrate the scale first to accurately place products
          </p>
        </div>
      )}
    </Card>
  );
};