'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X } from 'lucide-react';

interface QRScannerProps {
  onScan: (code: string) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
}

export function QRScanner({ onScan, onError, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanner = async () => {
    setError(null);
    setIsScanning(true);

    try {
      // Dynamically import the library
      const { Html5Qrcode } = await import('html5-qrcode');
      
      // Wait a tick for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!containerRef.current) {
        throw new Error('Scanner container not found');
      }

      scannerRef.current = new Html5Qrcode('qr-scanner-container');
      
      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText: string) => {
          // Extract code from URL if it's a card URL
          let code = decodedText;
          const cardMatch = decodedText.match(/\/card\/([A-Z0-9-]+)/i);
          if (cardMatch) {
            code = cardMatch[1].toUpperCase();
          }
          
          // Stop scanner and call callback
          stopScanner();
          onScan(code);
        },
        () => {
          // Ignore QR not found errors (normal during scanning)
        }
      );
    } catch (err: any) {
      console.error('QR Scanner error:', err);
      setIsScanning(false);
      
      let errorMsg = 'Could not start camera';
      if (err?.message?.includes('NotAllowedError') || err?.message?.includes('Permission')) {
        errorMsg = 'Camera permission denied. Please allow camera access in your browser settings.';
      } else if (err?.message?.includes('NotFoundError') || err?.message?.includes('Requested device not found')) {
        errorMsg = 'No camera found on this device.';
      } else if (err?.message?.includes('NotReadableError')) {
        errorMsg = 'Camera is in use by another application.';
      } else if (err?.name === 'NotAllowedError') {
        errorMsg = 'Camera permission denied.';
      }
      
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (e) {
        // Ignore stop errors
      }
    }
    setIsScanning(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {!isScanning ? (
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-10 h-10 text-muted-foreground" />
          </div>
          
          {error ? (
            <div className="mb-4">
              <p className="text-red-500 text-sm mb-2">{error}</p>
              <p className="text-muted-foreground text-xs">
                Try using Manual Entry instead
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground mb-4">
              Click below to open camera and scan QR code
            </p>
          )}
          
          <Button onClick={startScanner} className="bg-brand hover:bg-brand/90">
            <Camera className="w-4 h-4 mr-2" />
            {error ? 'Try Again' : 'Start Camera'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div 
            id="qr-scanner-container" 
            ref={containerRef}
            className="rounded-lg overflow-hidden bg-black"
            style={{ width: '100%', minHeight: '300px' }}
          />
          <p className="text-sm text-center text-muted-foreground">
            Point camera at the QR code
          </p>
          <Button variant="outline" onClick={stopScanner} className="w-full">
            <X className="w-4 h-4 mr-2" />
            Cancel Scan
          </Button>
        </div>
      )}
    </div>
  );
}

export default QRScanner;
