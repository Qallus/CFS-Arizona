'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User,
  Save,
  Camera,
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  Calendar,
  Loader2,
  Check,
  AlertCircle,
  Building,
  Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  bio: string;
  location: string;
  website: string;
  avatar: string;
  timezone: string;
  dateJoined: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    firstName: 'Jeremy',
    lastName: 'Waters',
    email: 'jw@channelcast.io',
    phone: '+1 (602) 555-0123',
    company: 'ChannelCast',
    title: 'Founder & CEO',
    bio: 'Entrepreneur building and scaling multiple businesses. Focused on automation, marketing systems, and strategic growth.',
    location: 'Phoenix, AZ',
    website: 'https://channelcast.io',
    avatar: '',
    timezone: 'America/Phoenix',
    dateJoined: '2024-01-15',
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Implement API call to save profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
      setHasChanges(false);
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to save profile' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <User className="w-6 h-6 text-brand" />
            My Profile
          </h1>
          <p className="text-muted-foreground">Manage your personal information and account details</p>
        </div>
        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-brand hover:bg-brand/90"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        )}
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={cn(
          "mb-6 p-4 rounded-lg flex items-center gap-2",
          saveMessage.type === 'success' 
            ? "bg-green-500/10 border border-green-500/30 text-green-400"
            : "bg-red-500/10 border border-red-500/30 text-red-400"
        )}>
          {saveMessage.type === 'success' ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {saveMessage.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Avatar Card */}
        <Card className="bg-card/50 border-border lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-foreground">Profile Photo</CardTitle>
            <CardDescription>Your avatar displayed across the dashboard</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="w-32 h-32">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className="bg-brand/20 text-brand text-3xl">
                  {profile.firstName[0]}{profile.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 p-2 bg-brand rounded-full hover:bg-brand/90 transition-colors">
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg font-semibold text-foreground">
                {profile.firstName} {profile.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">{profile.title}</p>
              <Badge variant="outline" className="mt-2 border-brand/50 text-brand">
                Owner
              </Badge>
            </div>
            <div className="mt-4 w-full space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(profile.dateJoined).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{profile.timezone}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Info Card */}
        <Card className="bg-card/50 border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground">Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-2">First Name</label>
                <Input
                  value={profile.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-2">Last Name</label>
                <Input
                  value={profile.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone
                </label>
                <Input
                  value={profile.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-2 flex items-center gap-2">
                  <Building className="w-4 h-4" /> Company
                </label>
                <Input
                  value={profile.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Title
                </label>
                <Input
                  value={profile.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground block mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Location
                </label>
                <Input
                  value={profile.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground block mb-2 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" /> Website
                </label>
                <Input
                  value={profile.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground block mb-2">Bio</label>
              <Textarea
                value={profile.bio}
                onChange={(e) => handleChange('bio', e.target.value)}
                className="bg-secondary border-border min-h-[100px]"
                placeholder="Tell us about yourself..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Stats */}
        <Card className="bg-card/50 border-border lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-foreground">Account Overview</CardTitle>
            <CardDescription>Your activity and account statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-secondary rounded-lg text-center">
                <p className="text-2xl font-bold text-brand">127</p>
                <p className="text-sm text-muted-foreground">Contacts</p>
              </div>
              <div className="p-4 bg-secondary rounded-lg text-center">
                <p className="text-2xl font-bold text-green-500">34</p>
                <p className="text-sm text-muted-foreground">Active Leads</p>
              </div>
              <div className="p-4 bg-secondary rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-500">12</p>
                <p className="text-sm text-muted-foreground">Projects</p>
              </div>
              <div className="p-4 bg-secondary rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-500">$24.5K</p>
                <p className="text-sm text-muted-foreground">Pipeline Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
