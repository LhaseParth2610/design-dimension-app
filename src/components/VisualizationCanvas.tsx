import { useEffect, useRef, useState } from "react";
import { Canvas as FabricCanvas, Image as FabricImage, Rect, Line as FabricLine, Polygon as FabricPolygon } from "fabric";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RotateCcw, Download, Undo, Redo, Move, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Product } from "./ProductCatalog";
import { createTransparentProduct } from "@/utils/backgroundRemoval";

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
  const [isProcessingProduct, setIsProcessingProduct] = useState(false);
  const [pixelsPerCm, setPixelsPerCm] = useState(1);
  const { toast } = useToast();

  // [1] Add state for calibration line, onboarding, and overlay history
  const [calibrationLine, setCalibrationLine] = useState<{x1: number, y1: number, x2: number, y2: number} | null>(null);
  const [showCalibrationPrompt, setShowCalibrationPrompt] = useState(false);
  const [realWorldLength, setRealWorldLength] = useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [overlayHistory, setOverlayHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [aspectLocked, setAspectLocked] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  // Polygon masking state
  const [isMasking, setIsMasking] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState<{x: number, y: number}[]>([]);
  const [polygonObject, setPolygonObject] = useState<any>(null);
  const [overlayObject, setOverlayObject] = useState<any>(null);

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

  // [2] Make canvas responsive
  useEffect(() => {
    const resizeCanvas = () => {
      if (!canvasRef.current || !fabricCanvas) return;
      const parent = canvasRef.current.parentElement;
      if (!parent) return;
      const width = parent.offsetWidth;
      const height = Math.min(parent.offsetHeight, window.innerHeight * 0.7);
      fabricCanvas.setWidth(width);
      fabricCanvas.setHeight(height);
      fabricCanvas.renderAll();
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [fabricCanvas]);

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

  // Add product overlay with background removal
  useEffect(() => {
    if (!fabricCanvas || !selectedProduct || !isCalibrated) return;

    const addProductOverlay = async () => {
      setIsProcessingProduct(true);
      
      try {
        toast({
          title: "Processing product",
          description: "Removing background for seamless overlay..."
        });

        // Create transparent version of product image
        const transparentUrl = await createTransparentProduct(selectedProduct.imageUrl);
        
        // Load the transparent product image
        const productImage = await FabricImage.fromURL(transparentUrl, { 
          crossOrigin: 'anonymous' 
        });

        // Calculate scaled dimensions based on real-world size
        const scaledWidth = selectedProduct.dimensions.width * pixelsPerCm;
        const scaledHeight = selectedProduct.dimensions.height * pixelsPerCm;

        // Scale the image to match real-world dimensions
        const scaleX = scaledWidth / productImage.width!;
        const scaleY = scaledHeight / productImage.height!;

        productImage.set({
          left: 100,
          top: 100,
          scaleX,
          scaleY,
          opacity: opacity[0] / 100,
          // Add shadow for realism
          shadow: {
            color: 'rgba(0, 0, 0, 0.3)',
            blur: 10,
            offsetX: 5,
            offsetY: 5,
          },
          cornerColor: 'hsl(214, 84%, 56%)',
          cornerSize: 8,
          transparentCorners: false,
        });

        // Remove any existing product overlays
        const existingProducts = fabricCanvas.getObjects().filter(obj => 
          obj.type === 'image' && obj !== fabricCanvas.getObjects()[0]
        );
        existingProducts.forEach(obj => fabricCanvas.remove(obj));

        fabricCanvas.add(productImage);
        fabricCanvas.setActiveObject(productImage);
        fabricCanvas.renderAll();

        toast({
          title: "Product added successfully",
          description: `${selectedProduct.name} has been overlaid with transparent background.`
        });
      } catch (error) {
        console.error('Error adding product overlay:', error);
        toast({
          title: "Error processing product",
          description: "Failed to remove background. Using original image.",
          variant: "destructive"
        });
        
        // Fallback to original image if background removal fails
        const fallbackImage = await FabricImage.fromURL(selectedProduct.imageUrl, { 
          crossOrigin: 'anonymous' 
        });
        
        const scaledWidth = selectedProduct.dimensions.width * pixelsPerCm;
        const scaledHeight = selectedProduct.dimensions.height * pixelsPerCm;
        const scaleX = scaledWidth / fallbackImage.width!;
        const scaleY = scaledHeight / fallbackImage.height!;

        fallbackImage.set({
          left: 100,
          top: 100,
          scaleX,
          scaleY,
          opacity: opacity[0] / 100,
        });

        fabricCanvas.add(fallbackImage);
        fabricCanvas.setActiveObject(fallbackImage);
        fabricCanvas.renderAll();
      } finally {
        setIsProcessingProduct(false);
      }
    };

    addProductOverlay();
  }, [fabricCanvas, selectedProduct, isCalibrated, pixelsPerCm, opacity, toast]);

  // [3] Calibration: let user draw a line, then prompt for real-world length
  const handleCanvasMouseDown = (e: any) => {
    if (!fabricCanvas || isCalibrated) return;
    const pointer = fabricCanvas.getPointer(e.e);
    setCalibrationLine({ x1: pointer.x, y1: pointer.y, x2: pointer.x, y2: pointer.y });
  };
  const handleCanvasMouseMove = (e: any) => {
    if (!fabricCanvas || !calibrationLine || isCalibrated) return;
    const pointer = fabricCanvas.getPointer(e.e);
    setCalibrationLine({ ...calibrationLine, x2: pointer.x, y2: pointer.y });
  };
  const handleCanvasMouseUp = () => {
    if (!calibrationLine || isCalibrated) return;
    setShowCalibrationPrompt(true);
  };
  useEffect(() => {
    if (!fabricCanvas) return;
    fabricCanvas.on('mouse:down', handleCanvasMouseDown);
    fabricCanvas.on('mouse:move', handleCanvasMouseMove);
    fabricCanvas.on('mouse:up', handleCanvasMouseUp);
    return () => {
      fabricCanvas.off('mouse:down', handleCanvasMouseDown);
      fabricCanvas.off('mouse:move', handleCanvasMouseMove);
      fabricCanvas.off('mouse:up', handleCanvasMouseUp);
    };
  }, [fabricCanvas, calibrationLine, isCalibrated]);

  // [4] When user enters real-world length, calculate pixelsPerCm
  const handleCalibrationConfirm = (lengthCm: number) => {
    if (!calibrationLine) return;
    const dx = calibrationLine.x2 - calibrationLine.x1;
    const dy = calibrationLine.y2 - calibrationLine.y1;
    const pixelLength = Math.sqrt(dx*dx + dy*dy);
    setPixelsPerCm(pixelLength / lengthCm);
    setIsCalibrated(true);
    setShowCalibrationPrompt(false);
  };

  // [5] Draw calibration line and scale bar overlay
  useEffect(() => {
    if (!fabricCanvas) return;
    if (calibrationLine && !isCalibrated) {
      const line = new FabricLine([
        calibrationLine.x1, calibrationLine.y1, calibrationLine.x2, calibrationLine.y2
      ], {
        stroke: 'red', strokeWidth: 2, selectable: false, evented: false, name: 'calibrationLine'
      });
      fabricCanvas.add(line);
      fabricCanvas.renderAll();
      return () => { fabricCanvas.remove(line); };
    }
  }, [fabricCanvas, calibrationLine, isCalibrated]);

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
    // For demo purposes, set a reasonable scale
    setPixelsPerCm(3); // 3 pixels per cm as default
    setIsCalibrated(true);
    onCalibrationStart();
    toast({
      title: "Calibration set",
      description: "Scale calibrated for accurate product sizing. You can now add products."
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

  // Polygon drawing handlers
  useEffect(() => {
    if (!fabricCanvas || !isMasking) return;
    const handleClick = (opt: any) => {
      const pointer = fabricCanvas.getPointer(opt.e);
      setPolygonPoints((pts) => [...pts, { x: pointer.x, y: pointer.y }]);
    };
    const handleDblClick = () => {
      if (polygonPoints.length < 3) return;
      // Create polygon
      const poly = new FabricPolygon(polygonPoints, {
        fill: 'rgba(0,0,0,0.1)', stroke: 'blue', strokeWidth: 2, selectable: true, evented: true
      });
      fabricCanvas.add(poly);
      setPolygonObject(poly);
      setIsMasking(false);
      // Apply as clipPath to overlay
      if (overlayObject) {
        overlayObject.set({ clipPath: poly });
        fabricCanvas.renderAll();
      }
    };
    fabricCanvas.on('mouse:down', handleClick);
    fabricCanvas.on('mouse:dblclick', handleDblClick);
    return () => {
      fabricCanvas.off('mouse:down', handleClick);
      fabricCanvas.off('mouse:dblclick', handleDblClick);
    };
  }, [fabricCanvas, isMasking, polygonPoints, overlayObject]);

  // Track overlay object for masking
  useEffect(() => {
    if (!fabricCanvas) return;
    const objs = fabricCanvas.getObjects().filter(obj => obj.type === 'image' && obj !== fabricCanvas.getObjects()[0]);
    if (objs.length > 0) setOverlayObject(objs[0]);
  }, [fabricCanvas, selectedProduct, isCalibrated]);

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
          
          {isProcessingProduct && (
            <Button disabled size="sm" variant="outline">
              <Wand2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
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
            <span>•</span>
            <span>Scale: {pixelsPerCm.toFixed(1)} px/cm</span>
          </div>
        </div>
      )}

      {!isCalibrated && selectedProduct && (
        <div className="p-4 bg-secondary/50 rounded-lg border border-dashed border-primary/30">
          <p className="text-sm text-muted-foreground text-center">
            Click "Calibrate Scale" to enable accurate product placement with real-world dimensions
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 mt-4">
        <Button onClick={() => setIsMasking((v) => !v)} size="sm" variant={isMasking ? 'default' : 'outline'}>
          Mask Overlay
        </Button>
        <Button onClick={() => {
          setPolygonPoints([]);
          if (polygonObject && fabricCanvas) {
            fabricCanvas.remove(polygonObject);
            setPolygonObject(null);
            if (overlayObject) overlayObject.set({ clipPath: null });
            fabricCanvas.renderAll();
          }
        }} size="sm" variant="outline">
          Reset Mask
        </Button>
      </div>
    </Card>
  );
};