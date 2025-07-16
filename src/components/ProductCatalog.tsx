import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface Product {
  id: string;
  name: string;
  category: "curtains" | "sofa-covers" | "cushions";
  dimensions: {
    width: number; // in cm
    height: number; // in cm
  };
  imageUrl: string;
  price: number;
  colors: string[];
}

// Sample product data
const sampleProducts: Product[] = [
  {
    id: "curtain-1",
    name: "Classic Linen Curtain",
    category: "curtains",
    dimensions: { width: 140, height: 250 },
    imageUrl: "/placeholder.svg", // Will be replaced with generated images
    price: 89.99,
    colors: ["White", "Beige", "Navy"]
  },
  {
    id: "curtain-2", 
    name: "Blackout Panel",
    category: "curtains",
    dimensions: { width: 120, height: 220 },
    imageUrl: "/placeholder.svg",
    price: 119.99,
    colors: ["Charcoal", "Cream", "Forest Green"]
  },
  {
    id: "sofa-1",
    name: "Stretch Sofa Cover",
    category: "sofa-covers", 
    dimensions: { width: 200, height: 90 },
    imageUrl: "/placeholder.svg",
    price: 149.99,
    colors: ["Gray", "Brown", "Blue"]
  }
];

interface ProductCatalogProps {
  onProductSelect: (product: Product) => void;
  selectedProduct?: Product;
}

export const ProductCatalog = ({ onProductSelect, selectedProduct }: ProductCatalogProps) => {
  const [activeCategory, setActiveCategory] = useState<Product["category"]>("curtains");

  const filteredProducts = sampleProducts.filter(product => product.category === activeCategory);

  const formatDimensions = (width: number, height: number) => {
    return `${width} × ${height} cm`;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Product Catalog</h3>
          <p className="text-sm text-muted-foreground">
            Select a product to overlay on your photo
          </p>
        </div>

        <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as Product["category"])}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="curtains">Curtains</TabsTrigger>
            <TabsTrigger value="sofa-covers">Sofa Covers</TabsTrigger>
            <TabsTrigger value="cushions">Cushions</TabsTrigger>
          </TabsList>

          <TabsContent value={activeCategory} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((product) => (
                <Card 
                  key={product.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-soft ${
                    selectedProduct?.id === product.id 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : ''
                  }`}
                  onClick={() => onProductSelect(product)}
                >
                  <div className="space-y-3">
                    <div className="aspect-square bg-canvas-bg rounded-lg flex items-center justify-center">
                      <div className="text-muted-foreground text-sm">
                        Product Image
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">{product.name}</h4>
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {formatDimensions(product.dimensions.width, product.dimensions.height)}
                        </Badge>
                        <span className="text-sm font-semibold">
                          ${product.price}
                        </span>
                      </div>
                      
                      <div className="flex gap-1">
                        {product.colors.slice(0, 3).map((color, index) => (
                          <div 
                            key={index}
                            className="w-4 h-4 rounded-full border border-photo-border"
                            style={{ backgroundColor: color.toLowerCase() }}
                            title={color}
                          />
                        ))}
                        {product.colors.length > 3 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            +{product.colors.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      size="sm"
                      className="w-full"
                      variant={selectedProduct?.id === product.id ? "default" : "outline"}
                    >
                      {selectedProduct?.id === product.id ? "Selected" : "Select Product"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};