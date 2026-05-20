'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe,
  Save,
  Eye,
  EyeOff,
  Camera,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Palette,
  Layout,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Link as LinkIcon,
  Mail,
  Phone,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PublicProfileData {
  slug: string;
  headline: string;
  bio: string;
  avatar: string;
  coverImage: string;
  ctaText: string;
  ctaUrl: string;
  showEmail: boolean;
  showPhone: boolean;
  showSocial: boolean;
  showTestimonials: boolean;
  accentColor: string;
  layout: 'centered' | 'sidebar' | 'hero';
  socialLinks: {
    facebook: string;
    twitter: string;
    linkedin: string;
    instagram: string;
  };
}

export default function PublicProfilePage() {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  const [profile, setProfile] = useState<PublicProfileData>({
    slug: 'jeremy-waters',
    headline: 'Helping businesses scale with automation and strategic systems',
    bio: 'Entrepreneur and strategist with 10+ years of experience building and scaling businesses. I specialize in marketing automation, CRM systems, and growth strategies that deliver measurable results.',
    avatar: '',
    coverImage: '',
    ctaText: 'Schedule a Consultation',
    ctaUrl: '/appointments',
    showEmail: true,
    showPhone: false,
    showSocial: true,
    showTestimonials: true,
    accentColor: '#00fc83',
    layout: 'centered',
    socialLinks: {
      facebook: '',
      twitter: 'https://twitter.com/jwaters',
      linkedin: 'https://linkedin.com/in/jeremywaters',
      instagram: '',
    },
  });

  const profileUrl = `https://channelcast.io/p/${profile.slug}`;

  const handleChange = (field: keyof PublicProfileData, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSocialChange = (platform: keyof typeof profile.socialLinks, value: string) => {
    setProfile(prev => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value }
    }));
    setHasChanges(true);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveMessage({ type: 'success', text: 'Public profile updated!' });
      setHasChanges(false);
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to save' });
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
            <Globe className="w-6 h-6 text-brand" />
            Public Profile
          </h1>
          <p className="text-muted-foreground">Customize your public-facing profile for campaigns and landing pages</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href={profileUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Preview
            </a>
          </Button>
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
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={cn(
          "mb-6 p-4 rounded-lg flex items-center gap-2",
          saveMessage.type === 'success' 
            ? "bg-green-500/10 border border-green-500/30 text-green-400"
            : "bg-red-500/10 border border-red-500/30 text-red-400"
        )}>
          {saveMessage.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {saveMessage.text}
        </div>
      )}

      {/* Profile URL */}
      <Card className="bg-card/50 border-border mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <LinkIcon className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Your public profile URL</p>
                <p className="text-foreground font-mono">{profileUrl}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleCopyUrl}>
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="content" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="content" className="data-[state=active]:bg-muted">
            <MessageSquare className="w-4 h-4 mr-2" />
            Content
          </TabsTrigger>
          <TabsTrigger value="appearance" className="data-[state=active]:bg-muted">
            <Palette className="w-4 h-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="social" className="data-[state=active]:bg-muted">
            <Share2 className="w-4 h-4 mr-2" />
            Social Links
          </TabsTrigger>
          <TabsTrigger value="privacy" className="data-[state=active]:bg-muted">
            <Eye className="w-4 h-4 mr-2" />
            Privacy
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Profile Content</CardTitle>
                <CardDescription>What visitors see on your public profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">URL Slug</Label>
                  <div className="flex gap-2 mt-1">
                    <span className="flex items-center text-muted-foreground text-sm">/p/</span>
                    <Input
                      value={profile.slug}
                      onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Headline</Label>
                  <Input
                    value={profile.headline}
                    onChange={(e) => handleChange('headline', e.target.value)}
                    placeholder="Your professional tagline"
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Bio</Label>
                  <Textarea
                    value={profile.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    placeholder="Tell visitors about yourself..."
                    className="bg-secondary border-border min-h-[150px] mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">CTA Button Text</Label>
                    <Input
                      value={profile.ctaText}
                      onChange={(e) => handleChange('ctaText', e.target.value)}
                      className="bg-secondary border-border mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">CTA URL</Label>
                    <Input
                      value={profile.ctaUrl}
                      onChange={(e) => handleChange('ctaUrl', e.target.value)}
                      className="bg-secondary border-border mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Live Preview */}
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Live Preview</CardTitle>
                <CardDescription>How your profile appears to visitors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-background rounded-lg p-6 border border-border">
                  <div className="flex flex-col items-center text-center">
                    <Avatar className="w-24 h-24">
                      <AvatarImage src={profile.avatar} />
                      <AvatarFallback className="bg-brand/20 text-brand text-2xl">JW</AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-bold text-foreground mt-4">Jeremy Waters</h3>
                    <p className="text-muted-foreground mt-1">{profile.headline}</p>
                    <p className="text-sm text-muted-foreground mt-4 max-w-md">{profile.bio}</p>
                    <Button 
                      className="mt-6"
                      style={{ backgroundColor: profile.accentColor }}
                    >
                      {profile.ctaText}
                    </Button>
                    {profile.showSocial && (
                      <div className="flex gap-3 mt-6">
                        {profile.socialLinks.twitter && <Twitter className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer" />}
                        {profile.socialLinks.linkedin && <Linkedin className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer" />}
                        {profile.socialLinks.facebook && <Facebook className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer" />}
                        {profile.socialLinks.instagram && <Instagram className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer" />}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Images</CardTitle>
                <CardDescription>Profile photo and cover image</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm text-muted-foreground">Profile Photo</Label>
                  <div className="mt-2 flex items-center gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={profile.avatar} />
                      <AvatarFallback className="bg-brand/20 text-brand text-xl">JW</AvatarFallback>
                    </Avatar>
                    <Button variant="outline">
                      <Camera className="w-4 h-4 mr-2" />
                      Change Photo
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Cover Image</Label>
                  <div className="mt-2 h-32 bg-secondary rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                    <Button variant="outline">Upload Cover Image</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Style</CardTitle>
                <CardDescription>Colors and layout options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-sm text-muted-foreground">Accent Color</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="color"
                      value={profile.accentColor}
                      onChange={(e) => handleChange('accentColor', e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border-0"
                    />
                    <Input
                      value={profile.accentColor}
                      onChange={(e) => handleChange('accentColor', e.target.value)}
                      className="bg-secondary border-border w-32"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Layout Style</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {['centered', 'sidebar', 'hero'].map((layout) => (
                      <button
                        key={layout}
                        onClick={() => handleChange('layout', layout)}
                        className={cn(
                          'p-4 rounded-lg border-2 transition-colors capitalize',
                          profile.layout === layout
                            ? 'border-brand bg-brand/10'
                            : 'border-border hover:border-brand/50'
                        )}
                      >
                        <Layout className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                        <span className="text-sm text-foreground">{layout}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Social Links Tab */}
        <TabsContent value="social" className="mt-0">
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Social Media Links</CardTitle>
              <CardDescription>Connect your social profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Twitter className="w-4 h-4" /> Twitter / X
                  </Label>
                  <Input
                    value={profile.socialLinks.twitter}
                    onChange={(e) => handleSocialChange('twitter', e.target.value)}
                    placeholder="https://twitter.com/username"
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Linkedin className="w-4 h-4" /> LinkedIn
                  </Label>
                  <Input
                    value={profile.socialLinks.linkedin}
                    onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Facebook className="w-4 h-4" /> Facebook
                  </Label>
                  <Input
                    value={profile.socialLinks.facebook}
                    onChange={(e) => handleSocialChange('facebook', e.target.value)}
                    placeholder="https://facebook.com/username"
                    className="bg-secondary border-border mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Instagram className="w-4 h-4" /> Instagram
                  </Label>
                  <Input
                    value={profile.socialLinks.instagram}
                    onChange={(e) => handleSocialChange('instagram', e.target.value)}
                    placeholder="https://instagram.com/username"
                    className="bg-secondary border-border mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="mt-0">
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Privacy Settings</CardTitle>
              <CardDescription>Control what information is visible on your public profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Show Email Address</p>
                    <p className="text-sm text-muted-foreground">Display your email on the public profile</p>
                  </div>
                </div>
                <Switch
                  checked={profile.showEmail}
                  onChange={(checked) => handleChange('showEmail', checked)}
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Show Phone Number</p>
                    <p className="text-sm text-muted-foreground">Display your phone on the public profile</p>
                  </div>
                </div>
                <Switch
                  checked={profile.showPhone}
                  onChange={(checked) => handleChange('showPhone', checked)}
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <Share2 className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Show Social Links</p>
                    <p className="text-sm text-muted-foreground">Display social media icons</p>
                  </div>
                </div>
                <Switch
                  checked={profile.showSocial}
                  onChange={(checked) => handleChange('showSocial', checked)}
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">Show Testimonials</p>
                    <p className="text-sm text-muted-foreground">Display client testimonials if available</p>
                  </div>
                </div>
                <Switch
                  checked={profile.showTestimonials}
                  onChange={(checked) => handleChange('showTestimonials', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
