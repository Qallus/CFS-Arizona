'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Plus,
  Search,
  Loader2,
  Edit2,
  Trash2,
  Copy,
  Eye,
  X,
  Save,
  Code,
  Layout,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text?: string;
  category: string;
  variables?: string[];
  createdAt: string;
  updatedAt: string;
}

export function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create/Edit form state
  const [formName, setFormName] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formCategory, setFormCategory] = useState('Custom');
  const [formHtml, setFormHtml] = useState('');
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/email/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formName || !formSubject || !formHtml) return;

    setSaving(true);
    try {
      const response = await fetch('/api/email/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          subject: formSubject,
          category: formCategory,
          html: formHtml,
        }),
      });

      if (response.ok) {
        fetchTemplates();
        setShowCreateModal(false);
        resetForm();
      }
    } catch (err) {
      console.error('Error creating template:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingTemplate || !formName || !formSubject || !formHtml) return;

    setSaving(true);
    try {
      const response = await fetch('/api/email/templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTemplate.id,
          name: formName,
          subject: formSubject,
          category: formCategory,
          html: formHtml,
        }),
      });

      if (response.ok) {
        fetchTemplates();
        setEditingTemplate(null);
        resetForm();
      }
    } catch (err) {
      console.error('Error updating template:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await fetch(`/api/email/templates?id=${id}`, { method: 'DELETE' });
      fetchTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
    }
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    try {
      await fetch('/api/email/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          subject: template.subject,
          category: template.category,
          html: template.html,
        }),
      });
      fetchTemplates();
    } catch (err) {
      console.error('Error duplicating template:', err);
    }
  };

  const startEditing = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormName(template.name);
    setFormSubject(template.subject);
    setFormCategory(template.category);
    setFormHtml(template.html);
  };

  const resetForm = () => {
    setFormName('');
    setFormSubject('');
    setFormCategory('Custom');
    setFormHtml(getDefaultHtml());
  };

  const getDefaultHtml = () => `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; text-align: center; background-color: #14532d;">
        <h1 style="color: #ffffff; margin: 0;">Your Title Here</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #333333; margin-top: 0;">Hi {{first_name}},</h2>
        <p style="color: #666666; line-height: 1.6;">
          Your email content goes here.
        </p>
        <p style="color: #666666; line-height: 1.6;">
          Best regards,<br>
          Your Team
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; background-color: #f8f8f8; text-align: center;">
        <p style="color: #999999; font-size: 12px; margin: 0;">
          © 2026 Your Company. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !search || 
      template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.subject.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Preview Modal
  if (previewTemplate) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card border border-border rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div>
              <h3 className="font-semibold text-foreground">{previewTemplate.name}</h3>
              <p className="text-sm text-muted-foreground">{previewTemplate.subject}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setPreviewTemplate(null)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="p-4 bg-gray-100">
            <div 
              className="bg-white rounded shadow-sm max-w-[600px] mx-auto"
              dangerouslySetInnerHTML={{ __html: previewTemplate.html }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Create/Edit Modal
  if (showCreateModal || editingTemplate) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card border border-border rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <h3 className="font-semibold text-foreground">
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </h3>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => {
                setShowCreateModal(false);
                setEditingTemplate(null);
                resetForm();
              }}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Left: Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Template Name</label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Welcome Email"
                    className="bg-secondary border-border"
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Subject Line</label>
                  <Input
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="e.g., Welcome to {{company_name}}!"
                    className="bg-secondary border-border"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use {'{{variable}}'} for dynamic content
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground"
                  >
                    <option value="Custom">Custom</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Sales">Sales</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Support">Support</option>
                    <option value="Transactional">Transactional</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm text-muted-foreground">HTML Content</label>
                    <div className="flex gap-1">
                      <Button
                        variant={viewMode === 'code' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('code')}
                      >
                        <Code className="w-4 h-4 mr-1" />
                        Code
                      </Button>
                      <Button
                        variant={viewMode === 'preview' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('preview')}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>
                    </div>
                  </div>
                  
                  {viewMode === 'code' ? (
                    <Textarea
                      value={formHtml}
                      onChange={(e) => setFormHtml(e.target.value)}
                      className="min-h-[400px] bg-secondary border-border font-mono text-xs resize-none"
                      placeholder="Enter HTML content..."
                    />
                  ) : (
                    <div className="min-h-[400px] bg-gray-100 rounded-lg p-4 overflow-auto">
                      <div 
                        className="bg-white rounded shadow-sm max-w-[600px] mx-auto"
                        dangerouslySetInnerHTML={{ __html: formHtml }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Help */}
              <div className="space-y-4">
                <Card className="bg-secondary/30 border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Palette className="w-4 h-4 text-brand" />
                      Design Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>• Use inline CSS for email compatibility</p>
                    <p>• Keep width under 600px for mobile</p>
                    <p>• Use tables for layout structure</p>
                    <p>• Test in multiple email clients</p>
                  </CardContent>
                </Card>

                <Card className="bg-secondary/30 border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Layout className="w-4 h-4 text-blue-500" />
                      Available Variables
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <code className="block text-brand/90">{'{{first_name}}'}</code>
                    <code className="block text-brand/90">{'{{last_name}}'}</code>
                    <code className="block text-brand/90">{'{{email}}'}</code>
                    <code className="block text-brand/90">{'{{company_name}}'}</code>
                    <code className="block text-brand/90">{'{{unsubscribe_url}}'}</code>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateModal(false);
                setEditingTemplate(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingTemplate ? handleUpdate : handleCreate}
              disabled={saving || !formName || !formSubject || !formHtml}
              className="bg-brand hover:bg-brand/90"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {editingTemplate ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main Template List
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-64 bg-secondary border-border"
            />
          </div>
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="px-3 py-2 bg-secondary border border-border rounded-lg text-foreground"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <Button 
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="bg-brand hover:bg-brand/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Template Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No templates found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="bg-card/50 border-border hover:border-brand/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-foreground">{template.name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">{template.category}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground truncate mb-4">
                  {template.subject}
                </p>
                {template.variables && template.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.variables.slice(0, 3).map((v, i) => (
                      <span key={i} className="px-2 py-0.5 bg-secondary rounded text-xs text-muted-foreground">
                        {v}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPreviewTemplate(template)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => startEditing(template)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDuplicate(template)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(template.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
