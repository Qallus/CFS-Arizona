'use client';

import { useState, useEffect, use, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save,
  Send,
  Eye,
  Download,
  Trash2,
  FileText,
  Calendar,
  User,
  Building2,
  PenTool,
  X,
  Check,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RichTextEditor, RichTextViewer } from '@/components/ui/rich-text-editor';

interface DocumentField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'date' | 'currency' | 'signature' | 'company' | 'name';
}

interface Document {
  id: string;
  name: string;
  type: string;
  templateId: string | null;
  projectId: string | null;
  content: string;
  fields: Record<string, string>;
  status: string;
  signatures: any[];
  signatureToken: string;
  createdAt: string;
  updatedAt: string;
}

interface Template {
  id: string;
  name: string;
  type: string;
  content: string;
  fields: DocumentField[];
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-500',
  sent: 'bg-blue-500/20 text-blue-500',
  viewed: 'bg-purple-500/20 text-purple-500',
  signed: 'bg-green-500/20 text-green-500',
  completed: 'bg-green-500/20 text-green-500',
};

export default function DocumentEditorPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = use(params);
  const [document, setDocument] = useState<Document | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [currentSignatureField, setCurrentSignatureField] = useState<string | null>(null);

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      const res = await fetch(`/api/documents?id=${documentId}`);
      const data = await res.json();
      setDocument(data.document);
      setFieldValues(data.document?.fields || {});
      
      // Fetch template if document has templateId
      if (data.document?.templateId) {
        const tpl = data.templates?.find((t: Template) => t.id === data.document.templateId);
        setTemplate(tpl || null);
      }
    } catch (error) {
      console.error('Error fetching document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!document) return;
    setSaving(true);
    
    try {
      await fetch('/api/documents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: document.id,
          name: document.name,
          content: document.content,
          fields: fieldValues,
        }),
      });
      fetchDocument();
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!document) return;
    
    try {
      await fetch('/api/documents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: document.id, status: newStatus }),
      });
      fetchDocument();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setFieldValues({ ...fieldValues, [key]: value });
  };

  const handleSignature = (signatureData: string) => {
    if (currentSignatureField) {
      setFieldValues({ ...fieldValues, [currentSignatureField]: signatureData });
      setShowSignatureModal(false);
      setCurrentSignatureField(null);
    }
  };

  const renderFilledContent = (content: string, values: Record<string, string>) => {
    let filled = content;
    Object.entries(values).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      if (key.includes('signature') && value) {
        filled = filled.replace(regex, `[Signed]`);
      } else {
        filled = filled.replace(regex, value || `[${key}]`);
      }
    });
    // Replace any remaining unfilled placeholders
    filled = filled.replace(/\{\{(\w+)\}\}/g, '[$1]');
    return filled;
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
    if (isNaN(num)) return value;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-muted-foreground mb-4">Document not found</p>
        <Link href="/projects" className="text-brand hover:underline">
          Back to Projects
        </Link>
      </div>
    );
  }

  const fields = template?.fields || [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={document.projectId ? `/projects/${document.projectId}` : '/projects'}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <input
                type="text"
                value={document.name}
                onChange={(e) => setDocument({ ...document, name: e.target.value })}
                className="text-xl font-bold text-foreground bg-transparent border-none focus:outline-none focus:ring-0"
              />
              <div className="flex items-center gap-2 mt-1">
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', STATUS_COLORS[document.status])}>
                  {document.status}
                </span>
                <span className="text-xs text-muted-foreground">
                  Last saved {new Date(document.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                showPreview ? 'bg-brand text-brand-foreground' : 'bg-secondary text-foreground hover:bg-secondary/80'
              )}
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
            {document.status === 'draft' && (
              <button
                onClick={() => handleStatusChange('sent')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Fields Panel */}
            {fields.length > 0 && !showPreview && (
              <div className="lg:col-span-1 space-y-4">
                <h3 className="font-semibold text-foreground">Document Fields</h3>
                <div className="space-y-3">
                  {fields.map((field) => (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        {field.label}
                      </label>
                      {field.type === 'signature' ? (
                        <div>
                          {fieldValues[field.key] ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 p-2 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-500">
                                ✓ Signed
                              </div>
                              <button
                                onClick={() => handleFieldChange(field.key, '')}
                                className="p-2 hover:bg-secondary rounded-lg text-red-500"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setCurrentSignatureField(field.key);
                                setShowSignatureModal(true);
                              }}
                              className="w-full flex items-center justify-center gap-2 px-3 py-3 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-brand hover:text-brand transition-colors"
                            >
                              <PenTool className="w-4 h-4" />
                              Click to Sign
                            </button>
                          )}
                        </div>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          value={fieldValues[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none"
                        />
                      ) : field.type === 'date' ? (
                        <input
                          type="date"
                          value={fieldValues[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                        />
                      ) : field.type === 'currency' ? (
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <input
                            type="text"
                            value={fieldValues[field.key] || ''}
                            onChange={(e) => handleFieldChange(field.key, e.target.value)}
                            className="w-full pl-7 pr-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                            placeholder="0.00"
                          />
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={fieldValues[field.key] || ''}
                          onChange={(e) => handleFieldChange(field.key, e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document Content */}
            <div className={cn(
              'bg-card rounded-xl border border-border overflow-hidden',
              fields.length > 0 && !showPreview ? 'lg:col-span-2' : 'lg:col-span-3'
            )}>
              {showPreview ? (
                <div className="p-8">
                  <RichTextViewer 
                    content={renderFilledContent(document.content || template?.content || '', fieldValues)}
                  />
                </div>
              ) : (
                <div className="p-0">
                  <RichTextEditor
                    content={document.content || template?.content || ''}
                    onChange={(content) => setDocument({ ...document, content })}
                    placeholder="Start typing your document..."
                  />
                  <p className="text-xs text-muted-foreground px-4 py-2 border-t border-border">
                    Use {'{{field_name}}'} to insert dynamic fields. Fields will be replaced with values from the sidebar.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      {showSignatureModal && (
        <SignatureModal
          onSign={handleSignature}
          onClose={() => {
            setShowSignatureModal(false);
            setCurrentSignatureField(null);
          }}
        />
      )}
    </div>
  );
}

// Signature Modal with Canvas
function SignatureModal({ onSign, onClose }: { onSign: (data: string) => void; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL('image/png');
    onSign(dataUrl);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl border border-border w-full max-w-lg">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Draw Your Signature</h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <div className="border-2 border-dashed border-border rounded-lg overflow-hidden bg-white">
            <canvas
              ref={canvasRef}
              width={450}
              height={200}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="cursor-crosshair w-full"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Draw your signature above using your mouse or touchpad
          </p>
        </div>
        <div className="flex justify-between p-4 border-t border-border">
          <button
            onClick={clearSignature}
            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-muted-foreground hover:text-foreground">
              Cancel
            </button>
            <button
              onClick={saveSignature}
              disabled={!hasSignature}
              className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Apply Signature
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
