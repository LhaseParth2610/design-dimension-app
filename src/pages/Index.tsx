import { useState } from "react";
import { PhotoUpload } from "@/components/PhotoUpload";
import { ProductCatalog, Product } from "@/components/ProductCatalog";
import { VisualizationCanvas } from "@/components/VisualizationCanvas";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Ruler, Smartphone } from "lucide-react";
import heroImage from "@/assets/hero-room.jpg";

const Index = () => {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<Product>();
  const [isCalibrating, setIsCalibrating] = useState(false);

  const handlePhotoSelect = (file: File, imageUrl: string) => {
    setPhotoFile(file);
    setPhotoUrl(imageUrl);
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleCalibrationStart = () => {
    setIsCalibrating(true);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      {!photoUrl && (
        <div className="relative overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="relative container mx-auto px-4 py-16 lg:py-24">
            <div className="text-center space-y-6 max-w-4xl mx-auto">
              <Badge className="mb-4" variant="secondary">
              <Sparkles className="mr-2 h-3 w-3" />
                Product Visualization
              </Badge>
              
              <h1 className="text-4xl lg:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Visualize Products in Your Space
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Upload a photo of your room and see exactly how curtains, sofa covers, 
                and other home products will look with dimension-accurate overlays.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <Card className="p-6 text-center shadow-soft">
                  <div className="p-3 bg-gradient-primary rounded-full w-fit mx-auto mb-4">
                    <Smartphone className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">Mobile Optimized</h3>
                  <p className="text-sm text-muted-foreground">
                    Works perfectly on phones, tablets, and desktop browsers
                  </p>
                </Card>

                <Card className="p-6 text-center shadow-soft">
                  <div className="p-3 bg-gradient-primary rounded-full w-fit mx-auto mb-4">
                    <Ruler className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">Dimension Accurate</h3>
                  <p className="text-sm text-muted-foreground">
                    Calibrate scale for precise, real-world product sizing
                  </p>
                </Card>

                <Card className="p-6 text-center shadow-soft">
                  <div className="p-3 bg-gradient-primary rounded-full w-fit mx-auto mb-4">
                    <Sparkles className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold mb-2">Easy to Use</h3>
                  <p className="text-sm text-muted-foreground">
                    Drag, resize, and rotate products with simple touch controls
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Photo Upload */}
          {!photoUrl && (
            <div className="lg:col-span-12">
              <PhotoUpload onPhotoSelect={handlePhotoSelect} />
            </div>
          )}

          {/* Main Content */}
          {photoUrl && (
            <>
              {/* Canvas */}
              <div className="lg:col-span-8">
                <VisualizationCanvas 
                  photoUrl={photoUrl}
                  selectedProduct={selectedProduct}
                  onCalibrationStart={handleCalibrationStart}
                />
              </div>

              {/* Product Catalog */}
              <div className="lg:col-span-4">
                <ProductCatalog 
                  onProductSelect={handleProductSelect}
                  selectedProduct={selectedProduct}
                />
              </div>
            </>
          )}
        </div>

        {/* Instructions */}
        {photoUrl && !selectedProduct && (
          <Card className="mt-6 p-6 bg-gradient-subtle border border-primary/20">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-primary">Getting Started</h3>
              <p className="text-sm text-muted-foreground">
                1. Select a product from the catalog on the right
                <br />
                2. Calibrate the scale by drawing over a known object
                <br />
                3. Position and adjust your product overlay
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
