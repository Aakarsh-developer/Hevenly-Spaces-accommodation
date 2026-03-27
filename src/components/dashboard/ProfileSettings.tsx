import { useEffect, useState } from 'react';
import { Camera, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ProfileSettings = () => {
  const { profile, uploadAvatar, updateProfile } = useApp();
  const [name, setName] = useState(profile?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setName(profile?.name || '');
    setAvatarUrl(profile?.avatar_url || '');
  }, [profile?.avatar_url, profile?.name]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar must be 5MB or smaller');
      return;
    }

    setUploading(true);
    const uploadedUrl = await uploadAvatar(file);
    setUploading(false);

    if (!uploadedUrl) {
      toast.error('Failed to upload avatar');
      return;
    }

    setAvatarUrl(uploadedUrl);
    toast.success('Avatar uploaded');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    setSaving(true);
    const success = await updateProfile({
      name: name.trim(),
      avatar_url: avatarUrl || undefined,
    });
    setSaving(false);

    if (success) {
      toast.success('Profile updated');
    } else {
      toast.error('Failed to update profile');
    }
  };

  return (
    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass overflow-hidden">
      <div className="grid items-stretch gap-0 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
        <form onSubmit={handleSave} className="space-y-6 p-6 md:p-8">
          <div>
            <h2 className="mb-1 font-heading text-xl font-semibold">Profile Settings</h2>
            <p className="text-sm text-muted-foreground">Update your public profile information, photo, and account identity details.</p>
          </div>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar className="h-20 w-20 border border-border shadow-sm">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback>{name.slice(0, 1).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-secondary px-4 py-2 transition-colors hover:bg-secondary/80">
                <Camera className="h-4 w-4 text-primary" />
                <span className="text-sm">{uploading ? 'Uploading...' : 'Change Avatar'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={uploading} />
              </label>
              <p className="text-xs text-muted-foreground">PNG, JPG, or WEBP up to 5MB.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none"
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-border bg-secondary/60 px-4 py-3 text-muted-foreground"
            />
          </div>

          <button type="submit" disabled={saving || uploading} className="btn-neon inline-flex items-center gap-2 disabled:opacity-60">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

        <div className="relative hidden min-h-[420px] overflow-hidden border-l border-border/60 xl:flex">
          <img
            src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80"
            alt="Modern workspace for profile management"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f5132]/85 via-[#14532d]/55 to-[#03150f]/80" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(134,239,172,0.22),transparent_34%)]" />
          <div className="relative flex h-full flex-col justify-end p-8 text-white">
            <div className="max-w-sm rounded-[28px] border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/75">Profile Space</p>
              <h3 className="mt-3 font-heading text-3xl font-semibold leading-tight">Keep your identity polished across every booking conversation.</h3>
              <p className="mt-3 text-sm leading-6 text-white/78">
                A strong profile helps owners, students, and future tenants trust who they are talking to before the first message or payment step.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default ProfileSettings;
