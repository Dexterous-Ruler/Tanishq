/**
 * Emergency Card Print/Share Utilities
 * Functions for printing and sharing emergency cards
 */

import html2canvas from 'html2canvas';

/**
 * Print the emergency card
 * @param elementId - ID of the element to print (default: 'emergency-card-content')
 */
export async function printEmergencyCard(elementId: string = 'emergency-card-content'): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Failed to open print window. Please allow popups.');
  }

  // Clone the element
  const clonedElement = element.cloneNode(true) as HTMLElement;
  
  // Create print stylesheet
  const printStyles = `
    <style>
      @media print {
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 20px;
          background: white;
        }
        .no-print {
          display: none !important;
        }
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        padding: 20px;
        background: white;
      }
    </style>
  `;

  printWindow.document.write(printStyles);
  printWindow.document.body.appendChild(clonedElement);
  printWindow.document.close();

  // Wait for content to load, then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      // Close window after printing (optional)
      // printWindow.close();
    }, 250);
  };
}

/**
 * Share emergency card as image
 * @param elementId - ID of the element to capture (default: 'emergency-card-content')
 */
export async function shareEmergencyCardAsImage(elementId: string = 'emergency-card-content'): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  try {
    // Capture element as canvas
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
      logging: false,
    });

    // Convert to blob
    canvas.toBlob(async (blob) => {
      if (!blob) {
        throw new Error('Failed to create image blob');
      }

      // Try Web Share API first (mobile)
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], 'emergency-card.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: 'Emergency Card',
              text: 'My emergency medical information',
              files: [file],
            });
            return;
          } catch (error) {
            // User cancelled or share failed, fall through to download
            if (error instanceof Error && error.name !== 'AbortError') {
              console.error('Share failed:', error);
            }
          }
        }
      }

      // Fallback: Download image
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'emergency-card.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  } catch (error) {
    throw new Error(`Failed to share emergency card: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download emergency card as PDF (using browser print to PDF)
 * @param elementId - ID of the element to print (default: 'emergency-card-content')
 */
export async function downloadEmergencyCardPDF(elementId: string = 'emergency-card-content'): Promise<void> {
  // Use the print function with PDF option
  await printEmergencyCard(elementId);
  // Note: User will need to select "Save as PDF" in the print dialog
}

/**
 * Share QR code image
 * @param qrCodeDataURL - Data URL of the QR code image
 */
export async function shareQRCode(qrCodeDataURL: string): Promise<void> {
  try {
    // Convert data URL to blob
    const response = await fetch(qrCodeDataURL);
    const blob = await response.blob();

    // Try Web Share API first (mobile)
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], 'emergency-qr-code.png', { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'Emergency QR Code',
            text: 'Scan this QR code to view emergency medical information',
            files: [file],
          });
          return;
        } catch (error) {
          // User cancelled or share failed, fall through to download
          if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Share failed:', error);
          }
        }
      }
    }

    // Fallback: Download image
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'emergency-qr-code.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(`Failed to share QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

