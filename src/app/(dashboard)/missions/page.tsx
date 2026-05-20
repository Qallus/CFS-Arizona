'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ListTodo, Plus, Trash2, ArrowUp, ArrowDown, Play, CheckCircle, AlertCircle, X, Clock, Tag } from "lucide-react";

interface Mission {
  id: string;
  title: string;
  description: string;
  status: 'queued' | 'in-progress' | 'completed' | 'blocked';
  priority: number;
  estimatedHours?: number;
  tags?: string[];
  blockedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export default function MissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newMission, setNewMission] = useState({
    title: '',
    description: '',
    estimatedHours: '',
    tags: ''
  });

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/missions');
      const data = await response.json();
      setMissions((data.missions || []).sort((a: Mission, b: Mission) => a.priority - b.priority));
    } catch (error) {
      console.error('Error loading missions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addMission = async () => {
    if (!newMission.title.trim()) return;
    
    const mission: Mission = {
      id: Date.now().toString(),
      title: newMission.title,
      description: newMission.description,
      status: 'queued',
      priority: missions.length,
      estimatedHours: newMission.estimatedHours ? parseFloat(newMission.estimatedHours) : undefined,
      tags: newMission.tags ? newMission.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', mission }),
      });
      setMissions([...missions, mission]);
      setNewMission({ title: '', description: '', estimatedHours: '', tags: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding mission:', error);
    }
  };

  const updateStatus = async (missionId: string, status: Mission['status']) => {
    try {
      await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', missionId, status }),
      });
      setMissions(missions.map(m => m.id === missionId ? { ...m, status, updatedAt: new Date().toISOString() } : m));
    } catch (error) {
      console.error('Error updating mission:', error);
    }
  };

  const movePriority = async (missionId: string, direction: 'up' | 'down') => {
    const index = missions.findIndex(m => m.id === missionId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === missions.length - 1) return;

    const newMissions = [...missions];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newMissions[index], newMissions[swapIndex]] = [newMissions[swapIndex], newMissions[index]];
    
    newMissions.forEach((m, i) => m.priority = i);
    setMissions(newMissions);

    try {
      await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reorder', missions: newMissions }),
      });
    } catch (error) {
      console.error('Error reordering missions:', error);
    }
  };

  const deleteMission = async (missionId: string) => {
    if (!confirm('Delete this mission?')) return;
    try {
      await fetch('/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', missionId }),
      });
      setMissions(missions.filter(m => m.id !== missionId));
    } catch (error) {
      console.error('Error deleting mission:', error);
    }
  };

  const statusConfig = {
    queued: { icon: <ListTodo className="w-4 h-4" />, color: 'border-zinc-500 text-muted-foreground', bg: 'bg-secondary/50' },
    'in-progress': { icon: <Play className="w-4 h-4" />, color: 'border-blue-500 text-blue-500', bg: 'bg-blue-900/20' },
    completed: { icon: <CheckCircle className="w-4 h-4" />, color: 'border-green-500 text-green-500', bg: 'bg-green-900/20' },
    blocked: { icon: <AlertCircle className="w-4 h-4" />, color: 'border-red-500 text-red-500', bg: 'bg-red-900/20' },
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ListTodo className="w-6 h-6 text-brand" />
            Mission Queue
          </h1>
          <p className="text-muted-foreground">Prioritized tasks in execution order</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-brand hover:bg-brand/90 text-white"
        >
          {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showForm ? 'Cancel' : 'New Mission'}
        </Button>
      </div>

      {/* Add Mission Form */}
      {showForm && (
        <Card className="mb-6 bg-card/50 border-border border-brand/30">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand" />
              Create New Mission
            </CardTitle>
            <CardDescription>Add a prioritized task to the mission queue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Mission Title *</label>
              <Input
                placeholder="e.g., Build customer onboarding flow"
                value={newMission.title}
                onChange={(e) => setNewMission({ ...newMission, title: e.target.value })}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Description</label>
              <Textarea
                placeholder="Describe the mission scope, deliverables, and success criteria..."
                value={newMission.description}
                onChange={(e) => setNewMission({ ...newMission, description: e.target.value })}
                className="bg-secondary border-border text-foreground min-h-[120px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Estimated Hours</label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="e.g., 4"
                  value={newMission.estimatedHours}
                  onChange={(e) => setNewMission({ ...newMission, estimatedHours: e.target.value })}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Tags (comma separated)</label>
                <Input
                  placeholder="e.g., dev, frontend, urgent"
                  value={newMission.tags}
                  onChange={(e) => setNewMission({ ...newMission, tags: e.target.value })}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={addMission} className="bg-brand hover:bg-brand/90">
                <Plus className="w-4 h-4 mr-2" />
                Add to Queue
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="border-border text-muted-foreground">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missions List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : missions.length === 0 ? (
        <Card className="bg-card/50 border-border">
          <CardContent className="py-12 text-center">
            <ListTodo className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No missions in queue. Add one above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {missions.map((mission, index) => (
            <Card key={mission.id} className={`border-border ${statusConfig[mission.status].bg}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col gap-1 items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={index === 0}
                      onClick={() => movePriority(mission.id, 'up')}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <span className="text-center text-sm font-bold text-brand">{index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={index === missions.length - 1}
                      onClick={() => movePriority(mission.id, 'down')}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-lg font-medium text-foreground">{mission.title}</h3>
                      <Badge variant="outline" className={statusConfig[mission.status].color}>
                        {statusConfig[mission.status].icon}
                        <span className="ml-1">{mission.status}</span>
                      </Badge>
                      {mission.estimatedHours && (
                        <Badge variant="outline" className="border-border text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          {mission.estimatedHours}h
                        </Badge>
                      )}
                    </div>
                    {mission.description && (
                      <p className="text-muted-foreground text-sm mb-2">{mission.description}</p>
                    )}
                    {mission.tags && mission.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {mission.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="border-border text-muted-foreground text-xs">
                            <Tag className="w-2 h-2 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    {mission.status === 'queued' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateStatus(mission.id, 'in-progress')}
                        className="text-blue-500 hover:text-blue-400"
                        title="Start"
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                    {mission.status === 'in-progress' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateStatus(mission.id, 'completed')}
                        className="text-green-500 hover:text-green-400"
                        title="Complete"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    {mission.status !== 'blocked' && mission.status !== 'completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateStatus(mission.id, 'blocked')}
                        className="text-red-500 hover:text-red-400"
                        title="Mark Blocked"
                      >
                        <AlertCircle className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMission(mission.id)}
                      className="text-muted-foreground hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
