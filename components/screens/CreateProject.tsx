'use client';

import { useMemo, useRef, useState } from 'react';
import { ArrowLeft, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type {
  ProjectCreationTeamContext,
  ProjectTeamMemberInput,
  RoleSeniorityLevel,
  TeamMemberRole,
} from '@/lib/mockApi';

interface CreateProjectProps {
  onBackToDashboard: () => void;
  onNext: (
    name: string,
    type: 'New' | 'Maintenance' | 'Migration',
    budget: number,
    template: string,
    documentName: string | undefined,
    teamContext: ProjectCreationTeamContext
  ) => void;
}

const ROLE_SENIORITY_OPTIONS: { value: RoleSeniorityLevel; label: string }[] = [
  { value: 'junior', label: 'Junior' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
];

const TEAM_ROLE_OPTIONS: { value: TeamMemberRole; label: string }[] = [
  { value: 'dev', label: 'Developer' },
  { value: 'qa', label: 'Quality Assurance' },
  { value: 'pm', label: 'Project Manager' },
  { value: 'designer', label: 'UI/UX Designer' },
  { value: 'tester', label: 'QA Tester' },
  { value: 'ba', label: 'Business Analyst' },
];

/** Stable ids so SSR and client first paint match (no hydration mismatch). */
const DEFAULT_TEAM_MEMBERS: ProjectTeamMemberInput[] = [
  { id: 'team-default-dev-1', role: 'dev', seniority: 'mid' },
  { id: 'team-default-dev-2', role: 'dev', seniority: 'mid' },
  { id: 'team-default-qa-1', role: 'qa', seniority: 'mid' },
  { id: 'team-default-pm-1', role: 'pm', seniority: 'mid' },
];

export function CreateProject({ onBackToDashboard, onNext }: CreateProjectProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'New' as 'New' | 'Maintenance' | 'Migration',
    budget: '',
    template: 'Standard',
    aiEstimationPrompt: '',
  });
  const [teamMembers, setTeamMembers] = useState<ProjectTeamMemberInput[]>(() =>
    DEFAULT_TEAM_MEMBERS.map((row) => ({ ...row }))
  );
  const newMemberIdSeqRef = useRef(0);
  const [document, setDocument] = useState<{ name: string }[] | []>([]);
  const [sourceCodeFolder, setSourceCodeFolder] = useState<{ name: string; fileCount: number } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [dragActiveSrc, setDragActiveSrc] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const teamRoleSummary = useMemo(() => {
    const counts = { dev: 0, qa: 0, pm: 0 };

    for (const member of teamMembers) {
      if (member.role === 'dev') {
        counts.dev += 1;
      } else if (member.role === 'qa') {
        counts.qa += 1;
      } else {
        counts.pm += 1;
      }
    }

    return { ...counts, total: teamMembers.length };
  }, [teamMembers]);

  const handleAddTeamMember = () => {
    newMemberIdSeqRef.current += 1;

    const newRow: ProjectTeamMemberInput = {
      id: `team-added-${newMemberIdSeqRef.current}`,
      role: 'dev',
      seniority: 'mid',
    };

    setTeamMembers((prev) => [...prev, newRow]);
  };

  const handleRemoveTeamMember = (memberId: string) => {
    setTeamMembers((prev) => {
      if (prev.length <= 1) {
        toast.error('Keep at least one team member');
        return prev;
      }

      return prev.filter((m) => m.id !== memberId);
    });
  };

  const handleTeamMemberRoleChange = (memberId: string, role: TeamMemberRole) => {
    setTeamMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role } : m)));
  };

  const handleTeamMemberSeniorityChange = (memberId: string, seniority: RoleSeniorityLevel) => {
    setTeamMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, seniority } : m)));
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

    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files).map(file => ({ name: file.name }));
      setDocument(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({ name: file.name }));
      setDocument(prev => [...prev, ...newFiles]);
    }
  };

  const removeDocument = (index: number) => {
    setDocument(prev => prev.filter((_, i) => i !== index));
  };

  const handleSourceCodeFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const firstFile = files[0] as any;
      const folderPath = firstFile.webkitRelativePath || firstFile.name;
      const folderName = folderPath.split('/')[0];

      setSourceCodeFolder({
        name: folderName,
        fileCount: files.length,
      });
    }
  };

  const handleSourceCodeDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveSrc(true);
  };

  const handleSourceCodeDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveSrc(false);
  };

  const handleSourceCodeDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSourceCodeDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActiveSrc(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      const firstFile = files[0] as any;
      const folderPath = firstFile.webkitRelativePath || firstFile.name;
      const folderName = folderPath.split('/')[0];

      setSourceCodeFolder({
        name: folderName,
        fileCount: files.length,
      });
    }
  };

  const clearSourceCodeFolder = () => {
    setSourceCodeFolder(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.budget) {
      toast.error('Please fill in all required fields');
      return;
    }

    const budgetValue = Number.parseInt(formData.budget, 10);

    if (Number.isNaN(budgetValue) || budgetValue < 0) {
      toast.error('Budget must be a non-negative number');
      return;
    }

    if (teamMembers.length === 0) {
      toast.error('Add at least one team member');
      return;
    }

    setLoading(true);
    try {
      const documentNames = document.length > 0 ? document.map(d => d.name).join(', ') : undefined;
      const sourceCodeInfo = sourceCodeFolder ? `Folder: ${sourceCodeFolder.name} (${sourceCodeFolder.fileCount} files)` : undefined;

      const teamContext: ProjectCreationTeamContext = {
        aiEstimationPrompt: formData.aiEstimationPrompt.trim(),
        teamInput: {
          members: teamMembers.map(({ id, role, seniority }) => ({ id, role, seniority })),
        },
      };

      await onNext(
        formData.name,
        formData.type,
        budgetValue,
        formData.template,
        documentNames || sourceCodeInfo || undefined,
        teamContext
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
              onChange={handleFieldChange}
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
              onChange={handleFieldChange}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="New">New Project</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Migration">Migration</option>
            </select>
          </div>

          {/* Budget */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-foreground mb-3">Budget *</label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">$</span>
              <Input
                type="number"
                name="budget"
                value={formData.budget}
                onChange={handleFieldChange}
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
              onChange={handleFieldChange}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Standard">Standard</option>
              <option value="Agile">Agile</option>
              <option value="Enterprise">Enterprise</option>
              <option value="Startup">Startup</option>
            </select>
          </div>

          {/* AI estimation prompt & team */}
          <div className="mb-8 rounded-lg border border-border bg-muted/30 p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">AI estimation guidance</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Instructions or constraints you want the estimator to follow (tone, methodology, risk appetite, tech stack hints, etc.).
              </p>
              <Textarea
                name="aiEstimationPrompt"
                value={formData.aiEstimationPrompt}
                onChange={handleFieldChange}
                placeholder="Example: Prefer conservative estimates; assume React/Next.js and PostgreSQL; flag integration risk if APIs are undocumented."
                className="min-h-28 w-full bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Team composition</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Add each team member, choose their role, and set their individual seniority level.
              </p>

              <ul className="space-y-3 mb-4">
                {teamMembers.map((member, index) => (
                  <li
                    key={member.id}
                    className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3 rounded-lg border border-border bg-background p-3"
                  >
                    <span className="text-xs font-medium text-muted-foreground sm:w-8 sm:pt-2 shrink-0">
                      {index + 1}.
                    </span>
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-xs font-medium text-foreground mb-1">Role</label>
                      <select
                        value={member.role}
                        onChange={(e) =>
                          handleTeamMemberRoleChange(member.id, e.target.value as TeamMemberRole)
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {TEAM_ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 min-w-[140px]">
                      <label className="block text-xs font-medium text-foreground mb-1">Level</label>
                      <select
                        value={member.seniority}
                        onChange={(e) =>
                          handleTeamMemberSeniorityChange(
                            member.id,
                            e.target.value as RoleSeniorityLevel
                          )
                        }
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        {ROLE_SENIORITY_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveTeamMember(member.id)}
                      disabled={teamMembers.length <= 1}
                      className="h-9 w-9 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-40"
                      aria-label="Remove team member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>

              <Button
                type="button"
                variant="outline"
                onClick={handleAddTeamMember}
                className="w-full sm:w-auto gap-2 border-border mb-4"
              >
                <Plus className="h-4 w-4" />
                Add team member
              </Button>

              <p className="text-xs text-muted-foreground">
                Summary: {teamRoleSummary.dev} Dev, {teamRoleSummary.qa} QA, {teamRoleSummary.pm} PM -{' '}
                <span className="font-medium text-foreground">{teamRoleSummary.total} total</span>
              </p>
            </div>
          </div>

          {/* Source Code Folder */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-foreground mb-3">Source Code Folder (Optional)</label>
            <div
              onDragEnter={handleSourceCodeDragEnter}
              onDragLeave={handleSourceCodeDragLeave}
              onDragOver={handleSourceCodeDragOver}
              onDrop={handleSourceCodeDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActiveSrc ? 'border-primary bg-primary/5' : 'border-border bg-background'
              }`}
            >
              <Upload className={`w-12 h-12 mx-auto mb-4 ${dragActiveSrc ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="text-foreground font-medium mb-2">Drag and drop your source code folder here(folder only)</p>
              <p className="text-muted-foreground text-sm mb-4">or</p>
              <label className="inline-block">
                <span className="px-4 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:bg-primary/90 transition-colors font-medium">
                  Select Folder
                </span>
                <input
                  type="file"
                  onChange={handleSourceCodeFolderSelect}
                  className="hidden"
                  {...{ webkitdirectory: "" } as React.InputHTMLAttributes<HTMLInputElement>}
                />
              </label>
              {sourceCodeFolder && (
                <div className="mt-4 p-3 bg-muted rounded">
                  <p className="text-primary font-medium text-sm mb-1">Folder: {sourceCodeFolder.name}</p>
                  <p className="text-muted-foreground text-xs mb-2">Files: {sourceCodeFolder.fileCount}</p>
                  <button
                    onClick={clearSourceCodeFolder}
                    className="text-destructive hover:text-destructive/80 text-xs font-medium"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Document Upload */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-foreground mb-3">Upload Documents</label>
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
              <p className="text-foreground font-medium mb-2">Drag and drop your files here(pdf, doc, docx, txt only)</p>
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
                  multiple
                />
              </label>
              {document.length > 0 && (
                <div className="mt-4">
                  <p className="text-primary font-medium mb-2">Uploaded files ({document.length}):</p>
                  <ul className="text-left text-sm text-muted-foreground space-y-2">
                    {document.map((doc, idx) => (
                      <li key={idx} className="flex items-center justify-between gap-2 bg-muted p-2 rounded">
                        <span className="flex items-center gap-2">
                          {doc.name}
                        </span>
                        <button
                          onClick={() => removeDocument(idx)}
                          className="text-destructive hover:text-destructive/80 text-xs font-medium"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
