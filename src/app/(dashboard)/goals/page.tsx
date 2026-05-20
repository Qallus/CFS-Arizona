'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Target, Plus, Trash2, CheckCircle, PauseCircle, Circle, X, Calendar } from "lucide-react";

interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'paused';
  targetDate?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetDate: '',
    tags: ''
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/goals');
      const data = await response.json();
      setGoals(data.goals || []);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addGoal = async () => {
    if (!newGoal.title.trim()) return;
    
    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      description: newGoal.description,
      status: 'active',
      targetDate: newGoal.targetDate || undefined,
      tags: newGoal.tags ? newGoal.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', goal }),
      });
      setGoals([goal, ...goals]);
      setNewGoal({ title: '', description: '', targetDate: '', tags: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const updateStatus = async (goalId: string, status: Goal['status']) => {
    try {
      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', goalId, status }),
      });
      setGoals(goals.map(g => g.id === goalId ? { ...g, status, updatedAt: new Date().toISOString() } : g));
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (!confirm('Delete this goal?')) return;
    try {
      await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', goalId }),
      });
      setGoals(goals.filter(g => g.id !== goalId));
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const statusIcon = {
    active: <Circle className="w-5 h-5 text-blue-500" />,
    completed: <CheckCircle className="w-5 h-5 text-green-500" />,
    paused: <PauseCircle className="w-5 h-5 text-yellow-500" />,
  };

  const statusColors = {
    active: 'border-blue-500 text-blue-500',
    completed: 'border-green-500 text-green-500',
    paused: 'border-yellow-500 text-yellow-500',
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Target className="w-6 h-6 text-brand" />
            Goals
          </h1>
          <p className="text-muted-foreground">High-level objectives and targets</p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)}
          className="bg-brand hover:bg-brand/90 text-white"
        >
          {showForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showForm ? 'Cancel' : 'New Goal'}
        </Button>
      </div>

      {/* Add Goal Form */}
      {showForm && (
        <Card className="mb-6 bg-card/50 border-border border-brand/30">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand" />
              Create New Goal
            </CardTitle>
            <CardDescription>Define a high-level objective to track</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Goal Title *</label>
              <Input
                placeholder="e.g., Launch new product line"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            
            <div>
              <label className="text-sm text-muted-foreground block mb-2">Description</label>
              <Textarea
                placeholder="Describe this goal in detail, including success criteria..."
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                className="bg-secondary border-border text-foreground min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Target Date</label>
                <Input
                  type="date"
                  value={newGoal.targetDate}
                  onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Tags (comma separated)</label>
                <Input
                  placeholder="e.g., Q1, product, urgent"
                  value={newGoal.tags}
                  onChange={(e) => setNewGoal({ ...newGoal, tags: e.target.value })}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={addGoal} className="bg-brand hover:bg-brand/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Goal
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="border-border text-muted-foreground">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : goals.length === 0 ? (
        <Card className="bg-card/50 border-border">
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No goals yet. Create your first goal above.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => (
            <Card key={goal.id} className="bg-card/50 border-border hover:border-border transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <button onClick={() => {
                    const nextStatus = goal.status === 'active' ? 'completed' : goal.status === 'completed' ? 'paused' : 'active';
                    updateStatus(goal.id, nextStatus);
                  }} className="mt-1">
                    {statusIcon[goal.status]}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className={`text-lg font-medium ${goal.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {goal.title}
                      </h3>
                      <Badge variant="outline" className={statusColors[goal.status]}>
                        {goal.status}
                      </Badge>
                      {goal.targetDate && (
                        <Badge variant="outline" className="border-border text-muted-foreground">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(goal.targetDate).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                    {goal.description && (
                      <p className="text-muted-foreground text-sm mb-2">{goal.description}</p>
                    )}
                    {goal.tags && goal.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {goal.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="border-border text-muted-foreground text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteGoal(goal.id)}
                    className="text-muted-foreground hover:text-red-500"
                  >
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
