'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  FileText,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Clock,
  CheckCircle,
  Globe,
  Lock,
  ExternalLink,
  Image as ImageIcon,
  Calendar,
  RefreshCw,
  Tag,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TabType = 'posts' | 'add' | 'edit';

interface WPPost {
  id: number;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  status: 'publish' | 'draft' | 'pending' | 'private';
  date: string;
  modified: string;
  link: string;
  featured_media: number;
  categories: number[];
  tags: number[];
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string }>;
  };
}

interface WPMedia {
  id: number;
  title: { rendered: string };
  source_url: string;
}

interface WPCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

interface WPTag {
  id: number;
  name: string;
  slug: string;
  count: number;
}

const STATUS_CONFIG = {
  publish: { label: 'Published', color: 'bg-green-500/20 text-green-500', icon: Globe },
  draft: { label: 'Draft', color: 'bg-gray-500/20 text-gray-500', icon: FileText },
  pending: { label: 'Pending', color: 'bg-yellow-500/20 text-yellow-500', icon: Clock },
  private: { label: 'Private', color: 'bg-purple-500/20 text-purple-500', icon: Lock },
};

export default function PostsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [posts, setPosts] = useState<WPPost[]>([]);
  const [media, setMedia] = useState<WPMedia[]>([]);
  const [categories, setCategories] = useState<WPCategory[]>([]);
  const [tags, setTags] = useState<WPTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeMenu, setActiveMenu] = useState<number | null>(null);
  const [editingPost, setEditingPost] = useState<WPPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state for add/edit
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    status: 'draft' as 'publish' | 'draft' | 'pending' | 'private',
    featured_media: 0,
    categories: [] as number[],
    tags: [] as number[],
  });

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchPosts();
    }
    fetchMedia();
    fetchCategories();
    fetchTags();
  }, [activeTab, statusFilter]);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('per_page', '50');
      params.append('_embed', 'true');
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/wordpress/posts?${params}`);
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
        setPosts([]);
      } else {
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/wordpress/media');
      const data = await res.json();
      setMedia(data.media || []);
    } catch (err) {
      console.error('Error fetching media:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/wordpress/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/wordpress/tags');
      const data = await res.json();
      setTags(data.tags || []);
    } catch (err) {
      console.error('Error fetching tags:', err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  const handleEdit = (post: WPPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title.rendered.replace(/&#8217;/g, "'").replace(/&#8211;/g, "-").replace(/&amp;/g, "&"),
      content: post.content.rendered,
      excerpt: post.excerpt.rendered.replace(/<[^>]*>/g, '').trim(),
      status: post.status,
      featured_media: post.featured_media || 0,
      categories: post.categories || [],
      tags: post.tags || [],
    });
    setActiveTab('edit');
    setActiveMenu(null);
  };

  const handleAddNew = () => {
    setEditingPost(null);
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      status: 'draft',
      featured_media: 0,
      categories: [],
      tags: [],
    });
    setActiveTab('add');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const res = await fetch(`/api/wordpress/posts?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess('Post deleted successfully');
        fetchPosts();
      }
    } catch (err) {
      setError('Failed to delete post');
    }
    setActiveMenu(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const method = editingPost ? 'PUT' : 'POST';
      const body = editingPost
        ? { id: editingPost.id, ...formData }
        : formData;

      const res = await fetch('/api/wordpress/posts', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(editingPost ? 'Post updated successfully' : 'Post created successfully');
        setTimeout(() => {
          setActiveTab('posts');
          fetchPosts();
        }, 1500);
      }
    } catch (err) {
      setError('Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').substring(0, 150) + '...';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Posts</h1>
            <p className="text-sm text-muted-foreground">Manage WordPress posts on channelcast.io</p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Post
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => { setActiveTab('posts'); setEditingPost(null); }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'posts'
                ? 'bg-brand text-brand-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            <FileText className="w-4 h-4" />
            Posts
          </button>
          <button
            onClick={handleAddNew}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'add'
                ? 'bg-brand text-brand-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            )}
          >
            <Plus className="w-4 h-4" />
            Add Post
          </button>
          {activeTab === 'edit' && editingPost && (
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-brand text-brand-foreground"
            >
              <Edit className="w-4 h-4" />
              Edit Post
            </button>
          )}
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-500 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-500 text-sm">
            {success}
          </div>
        )}

        {/* Filters (only on posts tab) */}
        {activeTab === 'posts' && (
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </form>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
            >
              <option value="">All Status</option>
              <option value="publish">Published</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
              <option value="private">Private</option>
            </select>

            <button
              onClick={fetchPosts}
              className="p-2 bg-card border border-border rounded-lg hover:bg-secondary transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'posts' && (
          loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No posts found</p>
              <button
                onClick={handleAddNew}
                className="flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Post
              </button>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Title</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                    <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => {
                    const config = STATUS_CONFIG[post.status];
                    const StatusIcon = config?.icon || FileText;

                    return (
                      <tr key={post.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-start gap-3">
                            {post._embedded?.['wp:featuredmedia']?.[0]?.source_url ? (
                              <img
                                src={post._embedded['wp:featuredmedia'][0].source_url}
                                alt=""
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-foreground" dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {stripHtml(post.excerpt.rendered)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium', config?.color)}>
                            <StatusIcon className="w-3 h-3" />
                            {config?.label}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(post.date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="relative inline-block">
                            <button
                              onClick={() => setActiveMenu(activeMenu === post.id ? null : post.id)}
                              className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            >
                              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                            </button>
                            {activeMenu === post.id && (
                              <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-lg shadow-lg z-10">
                                <a
                                  href={post.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-secondary"
                                >
                                  <ExternalLink className="w-4 h-4" /> View Post
                                </a>
                                <button
                                  onClick={() => handleEdit(post)}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-secondary"
                                >
                                  <Edit className="w-4 h-4" /> Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(post.id)}
                                  className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-secondary text-red-500"
                                >
                                  <Trash2 className="w-4 h-4" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Add/Edit Form */}
        {(activeTab === 'add' || activeTab === 'edit') && (
          <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter post title..."
                className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand text-lg"
                required
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your post content here... (HTML supported)"
                rows={15}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand font-mono text-sm resize-y"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">HTML and WordPress block markup supported</p>
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Excerpt</label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Brief summary of the post (optional)"
                rows={3}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand resize-none"
              />
            </div>

            {/* Status & Featured Image */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="draft">Draft</option>
                  <option value="publish">Publish</option>
                  <option value="pending">Pending Review</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Featured Image</label>
                <select
                  value={formData.featured_media}
                  onChange={(e) => setFormData({ ...formData, featured_media: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-brand"
                >
                  <option value="0">No featured image</option>
                  {media.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title.rendered.replace(/&#8211;/g, '-')} (ID: {item.id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Categories & Tags */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Categories</label>
                <div className="bg-card border border-border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No categories found</p>
                  ) : (
                    categories.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.categories.includes(cat.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, categories: [...formData.categories, cat.id] });
                            } else {
                              setFormData({ ...formData, categories: formData.categories.filter(id => id !== cat.id) });
                            }
                          }}
                          className="w-4 h-4 rounded border-border text-brand focus:ring-brand"
                        />
                        <span className="text-sm text-foreground">{cat.name}</span>
                        <span className="text-xs text-muted-foreground">({cat.count})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tags</label>
                <div className="bg-card border border-border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {tags.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No tags found</p>
                  ) : (
                    tags.map((tag) => (
                      <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.tags.includes(tag.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, tags: [...formData.tags, tag.id] });
                            } else {
                              setFormData({ ...formData, tags: formData.tags.filter(id => id !== tag.id) });
                            }
                          }}
                          className="w-4 h-4 rounded border-border text-brand focus:ring-brand"
                        />
                        <span className="text-sm text-foreground">{tag.name}</span>
                        <span className="text-xs text-muted-foreground">({tag.count})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Preview selected image */}
            {formData.featured_media > 0 && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Image Preview</label>
                <img
                  src={media.find(m => m.id === formData.featured_media)?.source_url}
                  alt="Featured"
                  className="max-w-md rounded-lg border border-border"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setActiveTab('posts')}
                className="px-6 py-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {editingPost ? 'Update Post' : 'Create Post'}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
