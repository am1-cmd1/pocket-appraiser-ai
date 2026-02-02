"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";

interface PDFExporterProps {
  vrm: string;
  vehicleName: string;
  valuationData: any;
  reports: any[];
  totalReconCost: number;
  capturedImage?: string; // base64
}

export default function PDFExporter({ 
  vrm, 
  vehicleName, 
  valuationData, 
  reports, 
  totalReconCost,
  capturedImage 
}: PDFExporterProps) {
  const [generating, setGenerating] = useState(false);

  const generatePDF = () => {
    setGenerating(true);
    
    // Simulate a small delay for UI feedback
    setTimeout(() => {
      const doc = new jsPDF();

      // Brand Colors
      const primaryColor: [number, number, number] = [234, 179, 8]; // Yellow-500
      const slate900: [number, number, number] = [15, 23, 42];

      // --- HEADER ---
      // Background
      doc.setFillColor(slate900[0], slate900[1], slate900[2]);
      doc.rect(0, 0, 210, 40, "F");

      // Logo Text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("POCKET APPRAISER", 15, 20);
      
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text("AI", 87, 20); // Adjust position based on text width

      doc.setFontSize(10);
      doc.setTextColor(200, 200, 200);
      doc.text("OFFICIAL VEHICLE CONDITION REPORT", 15, 28);
      
      doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 195, 20, { align: "right" });

      // --- VEHICLE INFO ---
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(vehicleName || "Unknown Vehicle", 15, 55);

      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.setFont("courier", "bold"); // Monospace for VRM
      doc.text(vrm.toUpperCase(), 15, 62);

      // --- FINANCIALS ---
      // Draw a box
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(130, 45, 65, 30, 3, 3, "FD");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Est. Recon Cost", 140, 55);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(220, 38, 38); // Red
      doc.text(`£${totalReconCost.toLocaleString()}`, 140, 65);

      // --- EVIDENCE PHOTO ---
      let startY = 85;
      if (capturedImage) {
        try {
          // Add image (constrain to width 100, height auto)
          const imgProps = doc.getImageProperties(capturedImage);
          const pdfWidth = 100;
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          doc.addImage(capturedImage, "JPEG", 15, 80, pdfWidth, pdfHeight);
          
          // Draw a frame
          doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.setLineWidth(1);
          doc.rect(15, 80, pdfWidth, pdfHeight);

          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text("AI SCANNED EVIDENCE", 15, 80 + pdfHeight + 5);
          
          startY = 80 + pdfHeight + 15;
        } catch (e) {
          console.error("Failed to add image to PDF", e);
        }
      }

      // --- DEFECTS TABLE ---
      const tableData = reports.flatMap(r => r.defects).map(d => [
        d.part,
        d.type,
        d.severity,
        `£${d.cost}`
      ]);

      autoTable(doc, {
        startY: startY,
        head: [['Panel/Area', 'Defect Type', 'Severity', 'Est. Cost']],
        body: tableData,
        headStyles: {
          fillColor: slate900,
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        columnStyles: {
          3: { fontStyle: 'bold', halign: 'right' }
        },
        foot: [['', '', 'TOTAL', `£${totalReconCost.toLocaleString()}`]],
        footStyles: {
           fillColor: [255, 255, 255],
           textColor: [220, 38, 38],
           fontStyle: 'bold',
           halign: 'right'
        }
      });

      // --- FOOTER ---
      const pageHeight = doc.internal.pageSize.height;
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("Pocket Appraiser AI - Automated Assessment System", 105, pageHeight - 10, { align: "center" });

      doc.save(`${vrm}_Condition_Report.pdf`);
      setGenerating(false);
    }, 500);
  };

  return (
    <button
      onClick={generatePDF}
      disabled={generating}
      className="w-full bg-white text-slate-950 font-black py-5 rounded-2xl uppercase tracking-widest text-sm flex items-center justify-center gap-2 shadow-2xl hover:bg-slate-100 transition-colors"
    >
      {generating ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>
          <FileDown className="w-5 h-5" />
          Export Deal Sheet
        </>
      )}
    </button>
  );
}
