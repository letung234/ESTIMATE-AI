'use client';

import { useState } from 'react';
import { ArrowLeft, Upload, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CreateProjectProps {
  onBackToDashboard: () => void;
  onNext: (
    name: string,
    type: 'New' | 'Maintenance' | 'Migration',
    budget: number,
    template: string,
    documentName?: string
  ) => void;
}

export function CreateProject({ onBackToDashboard, onNext }: CreateProjectProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'New' as 'New' | 'Maintenance' | 'Migration',
    budget: '',
    template: 'Standard',
    sourceCode: '',
  });
  const [document, setDocument] = useState<{ name: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setDocument({ name: e.dataTransfer.files[0].name });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocument({ name: e.target.files[0].name });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.budget) {
      alert('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    try {
      await onNext(
        formData.name,
        formData.type,
        parseInt(formData.budget),
        formData.template,
        document?.name
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-6 py-6">
          <button
            onClick={onBackToDashboard}
            className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-foreground">Create New Project</h1>
          <p className="text-muted-foreground mt-2">Start by providing basic information about your project</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="bg-card border border-border rounded-lg p-8">
          {/* Project Name */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-foreground mb-3">Project Name *</label>
            <Input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., E-commerce Platform"
              className="w-full bg-background border-border text-foreground placeholder-muted-foreground"
            />
          </div>

          {/* Project Type */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-foreground mb-3">Project Type *</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="New">New Project</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Migration">Migration</option>
            </select>
          </div>

          {/* Budget */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-foreground mb-3">Budget (Optional)</label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                placeholder="Enter budget amount"
                className="flex-1 bg-background border-border text-foreground placeholder-muted-foreground"
              />
            </div>
          </div>

          {/* Template Selection */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-foreground mb-3">Template (Optional)</label>
            <select
              name="template"
              value={formData.template}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Standard">Standard</option>
              <option value="Agile">Agile</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Startup">Startup</option>
            </select>
          </div>

          {/* Document Upload */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-foreground mb-3">Upload Document</label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-border bg-background'
              }`}
            >
              <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="text-foreground font-medium mb-2">Drag and drop your file here</p>
              <p className="text-muted-foreground text-sm mb-4">or</p>
              <label className="inline-block">
                <span className="px-4 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:bg-primary/90 transition-colors font-medium">
                  Browse Files
                </span>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                />
              </label>
              {document && <p className="text-primary text-sm mt-4">📄 {document.name}</p>}
            </div>
          </div>

          {/* Source Code Link */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-foreground mb-3">Source Code Link (Optional)</label>
            <div className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-muted-foreground" />
              <Input
                type="url"
                name="sourceCode"
                value={formData.sourceCode}
                onChange={handleInputChange}
                placeholder="https://github.com/..."
                className="flex-1 bg-background border-border text-foreground placeholder-muted-foreground"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-8 border-t border-border">
            <Button
              onClick={onBackToDashboard}
              className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
              Next: Preview Document
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
