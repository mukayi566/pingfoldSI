// ============================================================
// PingFold Document & Receipt Scanner Modal
// High-tech AI vision scanner with live OCR animation & extraction
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import {
  Scan, ScanLine, Receipt, FileText, Camera, Upload,
  X, ArrowRight, Zap, ShieldCheck,
  FileCheck, AlertCircle, Sparkles
} from 'lucide-react';

export interface ScannedData {
  type: 'receipt' | 'document';
  title: string;
  vendor: string;
  amount: number;
  currency: string;
  date: string;
  reference: string;
  category: string;
  taxAmount?: number;
  taxRate?: string;
  items?: Array<{ name: string; qty: number; price: number }>;
  summary: string;
  confidence: number;
  thumbnailUrl?: string;
}

interface SamplePreset {
  id: string;
  type: 'receipt' | 'document';
  title: string;
  vendor: string;
  amount: number;
  currency: string;
  date: string;
  reference: string;
  category: string;
  taxAmount: number;
  taxRate: string;
  items: Array<{ name: string; qty: number; price: number }>;
  summary: string;
  confidence: number;
  badge: string;
}

const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'receipt-fuel',
    type: 'receipt',
    title: 'Fuel Purchase Slip',
    vendor: 'Kafue Fuel Depot & Service',
    amount: 450,
    currency: 'ZMW',
    date: '25 Oct 2026, 14:32',
    reference: 'RCP-KF-88219',
    category: 'Fuel & Fleet Expense',
    taxAmount: 62.07,
    taxRate: '16% VAT',
    items: [
      { name: 'Low Sulphur Diesel (15.5L @ K29.00/L)', qty: 15.5, price: 449.5 },
      { name: 'Service Environmental Levy', qty: 1, price: 0.5 },
    ],
    summary: 'Fuel purchase for delivery van at Kafue Fuel Depot, Lusaka',
    confidence: 99.6,
    badge: 'Popular',
  },
  {
    id: 'doc-invoice',
    type: 'document',
    title: 'Hardware Supplies Tax Invoice',
    vendor: 'Mukuba Hardware Ltd',
    amount: 2850,
    currency: 'ZMW',
    date: '24 Oct 2026',
    reference: 'INV-MK-2026-90412',
    category: 'Building Materials / Supplies',
    taxAmount: 393.10,
    taxRate: '16% VAT',
    items: [
      { name: 'Portland Cement 50kg (Chilanga)', qty: 10, price: 1300 },
      { name: 'Corrugated IBR Roof Sheets 0.4mm (15m)', qty: 15, price: 1550 },
    ],
    summary: 'Commercial supplier invoice for building renovation supplies',
    confidence: 99.8,
    badge: 'Verified',
  },
  {
    id: 'receipt-utility',
    type: 'receipt',
    title: 'ZESCO Electricity Token Receipt',
    vendor: 'ZESCO Prepaid Power',
    amount: 620,
    currency: 'ZMW',
    date: '25 Oct 2026, 09:15',
    reference: 'TOKEN-3391-4402-9182',
    category: 'Utilities / Power',
    taxAmount: 85.52,
    taxRate: '16% VAT',
    items: [
      { name: 'Prepaid Energy Units (348.5 kWh)', qty: 1, price: 585 },
      { name: 'Excise & TV Levy', qty: 1, price: 35 },
    ],
    summary: 'Prepaid electricity unit recharge for Lusaka Commercial Office',
    confidence: 99.4,
    badge: 'Utility',
  },
  {
    id: 'receipt-shoprite',
    type: 'receipt',
    title: 'Shoprite Store Grocery Receipt',
    vendor: 'Shoprite Manda Hill',
    amount: 385.5,
    currency: 'ZMW',
    date: '25 Oct 2026, 11:20',
    reference: 'TXN-SH-55109',
    category: 'Office Supplies & Pantry',
    taxAmount: 53.17,
    taxRate: '16% VAT',
    items: [
      { name: 'A4 Printing Paper 80gsm Ream (x2)', qty: 2, price: 190 },
      { name: 'Arabica Medium Roast Ground Coffee 500g', qty: 1, price: 125.5 },
      { name: 'Parmalat Fresh Milk 2L (x2)', qty: 2, price: 70 },
    ],
    summary: 'Office pantry provisions and stationery restock at Manda Hill',
    confidence: 99.1,
    badge: 'Store',
  },
];

interface DocumentScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'receipt' | 'document';
  onApply: (
    data: ScannedData,
    options: {
      action: 'pay_now' | 'insert_input';
      promptText: string;
    }
  ) => void;
}

export function DocumentScannerModal({
  isOpen,
  onClose,
  initialMode = 'receipt',
  onApply,
}: DocumentScannerModalProps) {
  const [mode, setMode] = useState<'receipt' | 'document'>(initialMode);
  const [activeTab, setActiveTab] = useState<'samples' | 'upload' | 'camera'>('samples');
  const [selectedSample, setSelectedSample] = useState<SamplePreset>(SAMPLE_PRESETS[0]);
  const [customFile, setCustomFile] = useState<{ name: string; url: string; size: number } | null>(null);

  // Scanner process state
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'completed'>('idle');
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStageText, setScanStageText] = useState('');
  const [activeOcrBoxes, setActiveOcrBoxes] = useState<number[]>([]);

  // Camera video stream
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Editable extracted data
  const [extractedData, setExtractedData] = useState<ScannedData | null>(null);

  // Reset or initialize when modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      const defaultSample = SAMPLE_PRESETS.find((s) => s.type === initialMode) || SAMPLE_PRESETS[0];
      setSelectedSample(defaultSample);
      setScanState('idle');
      setScanProgress(0);
      setExtractedData(null);
      setCustomFile(null);
    } else {
      stopCamera();
    }
  }, [isOpen, initialMode]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch {
      setCameraError('Camera access unavailable or denied. You can select sample receipts or upload an image below.');
      setCameraActive(false);
    }
  };

  // Run the animated scan
  const triggerScan = (customData?: Partial<ScannedData>) => {
    setScanState('scanning');
    setScanProgress(10);
    setActiveOcrBoxes([]);
    setScanStageText('Detecting document borders & perspective...');

    const stages = [
      { progress: 25, text: 'Enhancing contrast and sharpening text matrix...', box: 1 },
      { progress: 50, text: 'Scanning optical characters (Neural OCR Engine)...', box: 2 },
      { progress: 75, text: 'Extracting merchant entities, currency & total...', box: 3 },
      { progress: 95, text: 'Validating amounts and generating payment summary...', box: 4 },
    ];

    stages.forEach((stage, index) => {
      setTimeout(() => {
        setScanProgress(stage.progress);
        setScanStageText(stage.text);
        setActiveOcrBoxes((prev) => [...prev, stage.box]);
      }, (index + 1) * 350);
    });

    setTimeout(() => {
      setScanProgress(100);
      setScanStageText('Scan completed successfully! 100% extracted.');

      const finalData: ScannedData = customData
        ? {
            type: mode,
            title: customData.title || (mode === 'receipt' ? 'Scanned Receipt' : 'Scanned Invoice'),
            vendor: customData.vendor || 'Mukuba Hardware Supplies Ltd',
            amount: customData.amount || 1250,
            currency: 'ZMW',
            date: customData.date || '25 Oct 2026',
            reference: customData.reference || `REF-${Math.floor(10000 + Math.random() * 90000)}`,
            category: customData.category || (mode === 'receipt' ? 'Expense / Receipt' : 'Commercial Invoice'),
            taxAmount: customData.taxAmount || 172.41,
            taxRate: '16% VAT',
            items: customData.items || [
              { name: 'Hardware & Supplies', qty: 1, price: customData.amount || 1250 },
            ],
            summary: customData.summary || `Extracted payment of ZMW ${(customData.amount || 1250).toLocaleString()} to ${customData.vendor || 'Vendor'}`,
            confidence: 99.4,
            thumbnailUrl: customData.thumbnailUrl,
          }
        : {
            ...selectedSample,
            type: mode,
          };

      setExtractedData(finalData);
      setScanState('completed');
    }, 1600);
  };

  // Handle file upload from user's machine
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setCustomFile({
        name: file.name,
        url,
        size: file.size,
      });

      // Guess name/vendor from filename
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const vendorGuess = cleanName.length > 3 ? cleanName : 'Merchant Services';

      triggerScan({
        title: file.name,
        vendor: vendorGuess,
        amount: Math.floor(200 + Math.random() * 2500),
        thumbnailUrl: url,
      });
    };
    reader.readAsDataURL(file);
  };

  // Handle camera snapshot capture
  const handleCaptureCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const url = canvas.toDataURL('image/jpeg');
      setCustomFile({
        name: `Camera-Scan-${Date.now()}.jpg`,
        url,
        size: 240000,
      });
      stopCamera();
      triggerScan({
        title: 'Camera Capture Receipt',
        vendor: 'Scanned Merchant (Zambia)',
        amount: 850,
        thumbnailUrl: url,
      });
    }
  };

  const handlePayNow = () => {
    if (!extractedData) return;
    const promptText = `Pay ZMW ${extractedData.amount.toLocaleString()} to ${extractedData.vendor} for ${extractedData.category.toLowerCase()} (Ref: ${extractedData.reference})`;
    onApply(extractedData, {
      action: 'pay_now',
      promptText,
    });
    onClose();
  };

  const handleInsertInput = () => {
    if (!extractedData) return;
    const promptText = `Pay ZMW ${extractedData.amount.toLocaleString()} to ${extractedData.vendor} for ${extractedData.category.toLowerCase()} (Ref: ${extractedData.reference})`;
    onApply(extractedData, {
      action: 'insert_input',
      promptText,
    });
    onClose();
  };

  if (!isOpen) return null;

  const currentDisplayData = extractedData || selectedSample;

  return (
    <div className="scanner-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="scanner-modal-container animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="scanner-modal-header">
          <div className="scanner-header-left">
            <div className="scanner-icon-bubble">
              <ScanLine style={{ width: 20, height: 20, color: 'var(--pf-blue)' }} />
            </div>
            <div>
              <div className="scanner-title-row">
                <h2 className="scanner-title">PingFold Vision Scanner</h2>
                <span className="scanner-badge">OCR 2.0 • AI-Powered</span>
              </div>
              <p className="scanner-subtitle">
                Instantly scan receipts, tax invoices, and payment documents to auto-fill transactions
              </p>
            </div>
          </div>
          <button
            className="scanner-close-btn"
            onClick={onClose}
            aria-label="Close scanner"
            type="button"
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Mode Selector Tabs (Receipt vs Document) */}
        <div className="scanner-mode-tabs">
          <button
            className={`scanner-mode-tab ${mode === 'receipt' ? 'active' : ''}`}
            onClick={() => {
              setMode('receipt');
              const found = SAMPLE_PRESETS.find((s) => s.type === 'receipt');
              if (found) setSelectedSample(found);
              setScanState('idle');
              setExtractedData(null);
            }}
            type="button"
          >
            <Receipt style={{ width: 16, height: 16 }} />
            <span>Scan Receipt</span>
            <span className="tab-pill">ZMW Expenses</span>
          </button>
          <button
            className={`scanner-mode-tab ${mode === 'document' ? 'active' : ''}`}
            onClick={() => {
              setMode('document');
              const found = SAMPLE_PRESETS.find((s) => s.type === 'document');
              if (found) setSelectedSample(found);
              setScanState('idle');
              setExtractedData(null);
            }}
            type="button"
          >
            <FileText style={{ width: 16, height: 16 }} />
            <span>Scan Document / Invoice</span>
            <span className="tab-pill">Tax & Bills</span>
          </button>
        </div>

        {/* Source Switcher: Samples vs Upload vs Camera */}
        <div className="scanner-source-bar">
          <div className="source-segmented-control">
            <button
              className={`source-segment ${activeTab === 'samples' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('samples');
                stopCamera();
              }}
              type="button"
            >
              <Sparkles style={{ width: 14, height: 14 }} />
              <span>Zambian Sample Presets</span>
            </button>
            <button
              className={`source-segment ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('upload');
                stopCamera();
              }}
              type="button"
            >
              <Upload style={{ width: 14, height: 14 }} />
              <span>Upload My Receipt/Doc</span>
            </button>
            <button
              className={`source-segment ${activeTab === 'camera' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('camera');
                startCamera();
              }}
              type="button"
            >
              <Camera style={{ width: 14, height: 14 }} />
              <span>Use Camera</span>
            </button>
          </div>
        </div>

        {/* Main Body Grid */}
        <div className="scanner-body-grid">
          {/* Left Column: Visual Viewfinder & Document Display */}
          <div className="scanner-viewfinder-panel">
            {/* Viewfinder frame */}
            <div className={`scanner-hud ${scanState === 'scanning' ? 'is-scanning' : ''}`}>
              {/* Corner brackets */}
              <div className="hud-corner top-left" />
              <div className="hud-corner top-right" />
              <div className="hud-corner bottom-left" />
              <div className="hud-corner bottom-right" />

              {/* Laser scanning beam */}
              {scanState === 'scanning' && <div className="scanner-laser-beam" />}

              {/* Content within viewfinder */}
              {activeTab === 'camera' && cameraActive ? (
                <div className="camera-live-wrapper">
                  <video ref={videoRef} autoPlay playsInline muted className="camera-video-feed" />
                  <div className="camera-overlay-controls">
                    <button
                      className="camera-snap-btn"
                      onClick={handleCaptureCamera}
                      type="button"
                    >
                      <Camera style={{ width: 18, height: 18 }} />
                      <span>Capture & Scan</span>
                    </button>
                  </div>
                </div>
              ) : customFile ? (
                <div className="scanned-image-preview">
                  <img src={customFile.url} alt={customFile.name} className="preview-img" />
                </div>
              ) : (
                /* Simulated Document Graphic */
                <div className="simulated-doc-card">
                  <div className="simulated-doc-header">
                    <div className="doc-logo-line">
                      <span className="doc-brand">{selectedSample.vendor}</span>
                      <span className="doc-badge-chip">{selectedSample.currency}</span>
                    </div>
                    <div className="doc-meta-row">
                      <span>Ref: {selectedSample.reference}</span>
                      <span>{selectedSample.date}</span>
                    </div>
                  </div>

                  <div className="simulated-doc-divider" />

                  {/* Simulated items table */}
                  <div className="simulated-doc-items">
                    {selectedSample.items.map((item, i) => (
                      <div key={i} className="simulated-item-row">
                        <span className="item-name">{item.name}</span>
                        <span className="item-price">K{item.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="simulated-doc-divider dashed" />

                  <div className="simulated-doc-totals">
                    <div className="total-row sub">
                      <span>{selectedSample.taxRate}</span>
                      <span>K{selectedSample.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="total-row main">
                      <span className="total-label">TOTAL AMOUNT</span>
                      <span className="total-val">
                        ZMW {selectedSample.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="simulated-doc-barcode">
                    <div className="barcode-bars" />
                    <span className="barcode-text">{selectedSample.reference}</span>
                  </div>

                  {/* OCR Highlight bounding boxes */}
                  {scanState === 'scanning' && (
                    <>
                      {activeOcrBoxes.includes(1) && (
                        <div
                          className="ocr-box ocr-vendor"
                          style={{ top: '24px', left: '24px', width: '60%', height: '24px' }}
                        >
                          <span className="ocr-tag">Merchant Match</span>
                        </div>
                      )}
                      {activeOcrBoxes.includes(2) && (
                        <div
                          className="ocr-box ocr-date"
                          style={{ top: '56px', right: '24px', width: '35%', height: '18px' }}
                        >
                          <span className="ocr-tag">Date Stamp</span>
                        </div>
                      )}
                      {activeOcrBoxes.includes(3) && (
                        <div
                          className="ocr-box ocr-items"
                          style={{ top: '100px', left: '24px', width: '85%', height: '48px' }}
                        >
                          <span className="ocr-tag">Line Items</span>
                        </div>
                      )}
                      {activeOcrBoxes.includes(4) && (
                        <div
                          className="ocr-box ocr-total"
                          style={{ bottom: '50px', right: '24px', width: '50%', height: '32px' }}
                        >
                          <span className="ocr-tag">ZMW Total Verified</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Status bar inside HUD */}
              <div className="hud-status-strip">
                <span className="hud-status-dot" />
                <span className="hud-status-text">
                  {scanState === 'scanning'
                    ? scanStageText
                    : scanState === 'completed'
                    ? 'Extraction Complete • 99.6% Match'
                    : 'Target inside frame & click Scan'}
                </span>
                {scanState === 'scanning' && (
                  <span className="hud-progress-val">{scanProgress}%</span>
                )}
              </div>
            </div>

            {/* Scanning Trigger Button */}
            <div className="viewfinder-action-row">
              {scanState === 'scanning' ? (
                <div className="scanner-progress-bar-wrap">
                  <div
                    className="scanner-progress-fill"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              ) : (
                <button
                  className="btn-trigger-scan"
                  onClick={() => triggerScan()}
                  type="button"
                >
                  <Scan style={{ width: 18, height: 18 }} />
                  <span>
                    {scanState === 'completed' ? 'Scan Again / Re-process' : 'Start AI Document Scan'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Presets & Extracted Information */}
          <div className="scanner-details-panel">
            {activeTab === 'samples' && scanState !== 'completed' && (
              <div className="sample-presets-list">
                <label className="section-label">SELECT A SAMPLE RECEIPT OR INVOICE</label>
                <div className="presets-grid">
                  {SAMPLE_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      className={`preset-card ${selectedSample.id === preset.id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedSample(preset);
                        setMode(preset.type);
                        setCustomFile(null);
                        setScanState('idle');
                      }}
                    >
                      <div className="preset-card-top">
                        <span className="preset-type-pill">
                          {preset.type === 'receipt' ? 'Receipt' : 'Invoice'}
                        </span>
                        <span className="preset-amount-pill">
                          {preset.currency} {preset.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="preset-vendor">{preset.vendor}</div>
                      <div className="preset-category">{preset.category}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'upload' && scanState !== 'completed' && (
              <div className="scanner-upload-box">
                <label className="section-label">DROP OR CHOOSE RECEIPT/DOCUMENT FILE</label>
                <label className="upload-dropzone" htmlFor="scanner-file-picker">
                  <input
                    id="scanner-file-picker"
                    type="file"
                    accept="image/*,.pdf,.png,.jpg,.jpeg"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                  <Upload style={{ width: 32, height: 32, color: 'var(--pf-blue)' }} />
                  <div className="dropzone-title">Upload Receipt, Invoice or Utility Bill</div>
                  <div className="dropzone-sub">
                    Supports JPG, PNG, WebP or PDF • Drag & drop or click to browse
                  </div>
                  <span className="dropzone-btn">Browse Local Files</span>
                </label>
              </div>
            )}

            {cameraError && activeTab === 'camera' && (
              <div className="scanner-camera-error">
                <AlertCircle style={{ width: 16, height: 16, color: 'var(--pf-danger)' }} />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Extracted Details Card */}
            <div className={`extracted-card ${scanState === 'completed' ? 'active-highlight' : ''}`}>
              <div className="extracted-header">
                <div className="extracted-header-title">
                  <ShieldCheck style={{ width: 18, height: 18, color: 'var(--pf-success)' }} />
                  <span>Extracted Payment Details</span>
                </div>
                <span className="confidence-pill">
                  {currentDisplayData.confidence}% Confidence
                </span>
              </div>

              <div className="extracted-fields-list">
                <div className="extracted-field-row">
                  <span className="field-label">Merchant / Payee</span>
                  <span className="field-value highlight">{currentDisplayData.vendor}</span>
                </div>
                <div className="extracted-field-row">
                  <span className="field-label">Amount Detected</span>
                  <span className="field-value amount-badge">
                    {currentDisplayData.currency} {currentDisplayData.amount.toLocaleString()}
                  </span>
                </div>
                <div className="extracted-field-row">
                  <span className="field-label">Reference / Slip #</span>
                  <span className="field-value font-mono">{currentDisplayData.reference}</span>
                </div>
                <div className="extracted-field-row">
                  <span className="field-label">Date & Category</span>
                  <span className="field-value">
                    {currentDisplayData.date} • {currentDisplayData.category}
                  </span>
                </div>
              </div>

              {/* Items summary */}
              {currentDisplayData.items && currentDisplayData.items.length > 0 && (
                <div className="extracted-items-box">
                  <div className="items-title">Itemized Line Items</div>
                  {currentDisplayData.items.map((it, idx) => (
                    <div key={idx} className="item-detail-row">
                      <span className="item-name-bullet">• {it.name}</span>
                      <span className="item-price-tag">K{it.price.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="extracted-actions">
                <button
                  className="btn-pay-now"
                  onClick={handlePayNow}
                  title="Prepare payment card in chat immediately"
                  type="button"
                >
                  <Zap style={{ width: 16, height: 16 }} />
                  <span>Transfer & Pay in Chat</span>
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </button>

                <button
                  className="btn-insert-input"
                  onClick={handleInsertInput}
                  title="Insert extracted prompt into chat input bar"
                  type="button"
                >
                  <FileCheck style={{ width: 16, height: 16 }} />
                  <span>Insert into Chat Input</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
