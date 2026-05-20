'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Save, RefreshCw, Dna, User, Heart, FileText, Wrench } from "lucide-react";

const dnaFiles = [
  { id: 'soul', name: 'SOUL.md', icon: Heart, description: 'Core identity and personality' },
  { id: 'identity', name: 'IDENTITY.md', icon: Dna, description: 'Basic identity information' },
  { id: 'user', name: 'USER.md', icon: User, description: 'Information about you (Jeremy)' },
  { id: 'agents', name: 'AGENTS.md', icon: FileText, description: 'Agent instructions and guidelines' },
  { id: 'tools', name: 'TOOLS.md', icon: Wrench, description: 'Tool-specific notes and config' },
];

export default function DNAPage() {
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('soul');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/dna');
      const data = await response.json();
      setFiles(data.files || {});
      setHasChanges({});
    } catch (error) {
      console.error('Error loading DNA files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFile = async (fileId: string) => {
    setIsSaving(true);
    try {
      const fileConfig = dnaFiles.find(f => f.id === fileId);
      if (!fileConfig) return;

      await fetch('/api/dna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: fileConfig.name,
          content: files[fileId],
        }),
      });

      setHasChanges(prev => ({ ...prev, [fileId]: false }));
    } catch (error) {
      console.error('Error saving file:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleContentChange = (fileId: string, content: string) => {
    setFiles(prev => ({ ...prev, [fileId]: content }));
    setHasChanges(prev => ({ ...prev, [fileId]: true }));
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Dna className="w-6 h-6 text-brand" />
            DNA Configuration
          </h1>
          <p className="text-muted-foreground">Core identity and configuration files</p>
        </div>
        <Button
          variant="outline"
          onClick={loadFiles}
          disabled={isLoading}
          className="border-border text-muted-foreground hover:bg-secondary"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="bg-card/50 border-border">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="border-b border-border">
            <TabsList className="bg-secondary">
              {dnaFiles.map((file) => (
                <TabsTrigger
                  key={file.id}
                  value={file.id}
                  className="data-[state=active]:bg-secondary text-muted-foreground data-[state=active]:text-foreground"
                >
                  <file.icon className="w-4 h-4 mr-2" />
                  {file.name}
                  {hasChanges[file.id] && (
                    <Badge variant="outline" className="ml-2 border-brand text-brand text-xs">
                      Modified
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </CardHeader>

          <CardContent className="p-0">
            {dnaFiles.map((file) => (
              <TabsContent key={file.id} value={file.id} className="m-0">
                <div className="p-4 border-b border-border bg-secondary/30">
                  <CardTitle className="text-lg text-foreground">{file.name}</CardTitle>
                  <CardDescription>{file.description}</CardDescription>
                </div>
                <div className="p-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      Loading...
                    </div>
                  ) : (
                    <>
                      <Textarea
                        value={files[file.id] || ''}
                        onChange={(e) => handleContentChange(file.id, e.target.value)}
                        className="min-h-[400px] font-mono text-sm bg-card border-border text-foreground"
                        placeholder={`${file.name} content will appear here...`}
                      />
                      <div className="flex justify-end mt-4">
                        <Button
                          onClick={() => saveFile(file.id)}
                          disabled={isSaving || !hasChanges[file.id]}
                          className="bg-brand hover:bg-brand/90 text-white"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            ))}
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
