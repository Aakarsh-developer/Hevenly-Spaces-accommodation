import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ImagePlus, X, Home, MapPin, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';

const FACILITIES = ['WiFi', 'AC', 'Parking', 'Laundry', 'Kitchen', 'Gym', 'CCTV', 'Power Backup', 'Furnished', 'Geyser'];

interface AddRoomFormProps {
  onSuccess: () => void;
}

const AddRoomForm = ({ onSuccess }: AddRoomFormProps) => {
  const { addRoom, uploadRoomImages } = useApp();
  const [submitting, setSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<Array<{ name: string; url: string }>>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    city: '',
    area: '',
    college: '',
    latitude: '',
    longitude: '',
    room_type: 'single' as string,
    facilities: [] as string[],
  });

  useEffect(() => {
    const previews = selectedImages.map((file) => ({ name: file.name, url: URL.createObjectURL(file) }));
    setImagePreviews(previews);

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [selectedImages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.city || !form.area) {
      toast.error('Please fill required fields');
      return;
    }

    setSubmitting(true);
    const uploadedImageUrls = selectedImages.length > 0
      ? await uploadRoomImages(selectedImages)
      : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'];

    if (selectedImages.length > 0 && uploadedImageUrls.length !== selectedImages.length) {
      setSubmitting(false);
      toast.error('Failed to upload one or more images');
      return;
    }

    const success = await addRoom({
      title: form.title,
      description: form.description,
      price: Number(form.price),
      city: form.city,
      area: form.area,
      college: form.college || undefined,
      latitude: Number(form.latitude) || 18.52,
      longitude: Number(form.longitude) || 73.85,
      images: uploadedImageUrls,
      facilities: form.facilities,
      roomType: form.room_type,
      status: 'available',
      approvalStatus: 'pending',
      nearbyPlaces: [],
    });
    setSubmitting(false);

    if (success) {
      toast.success('Room added successfully and sent for admin review.');
      setSelectedImages([]);
      onSuccess();
    } else {
      toast.error('Failed to add room');
    }
  };

  const toggleFacility = (facility: string) => {
    setForm((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter((item) => item !== facility)
        : [...prev.facilities, facility],
    }));
  };

  const inputClass = 'w-full px-4 py-3 rounded-xl bg-secondary/80 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] gap-6 items-stretch xl:items-stretch">
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="order-1 glass p-6 lg:p-8 space-y-4 xl:pr-2"
      >
        <div className="mb-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 text-xs text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            Owner listing workspace
          </div>
          <h2 className="font-heading text-2xl font-semibold mt-4">Add a new room</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Publish a polished listing with location, pricing, room images, and facilities. Approved rooms become visible across the platform.
          </p>
        </div>

        <input
          type="text"
          placeholder="Room Title *"
          className={inputClass}
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          required
        />

        <textarea
          placeholder="Description"
          rows={4}
          className={inputClass}
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="Price (Rs/month) *"
            className={inputClass}
            value={form.price}
            onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
            required
          />
          <div className="flex gap-2">
            {(['single', 'shared'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, room_type: type }))}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${form.room_type === type ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="City *"
            className={inputClass}
            value={form.city}
            onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
            required
          />
          <input
            type="text"
            placeholder="Area *"
            className={inputClass}
            value={form.area}
            onChange={(e) => setForm((prev) => ({ ...prev, area: e.target.value }))}
            required
          />
        </div>

        <input
          type="text"
          placeholder="Nearby College (optional)"
          className={inputClass}
          value={form.college}
          onChange={(e) => setForm((prev) => ({ ...prev, college: e.target.value }))}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            step="any"
            placeholder="Latitude"
            className={inputClass}
            value={form.latitude}
            onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
          />
          <input
            type="number"
            step="any"
            placeholder="Longitude"
            className={inputClass}
            value={form.longitude}
            onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Room Images</label>
          <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/50 px-4 py-6 cursor-pointer hover:border-primary transition-colors">
            <ImagePlus className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Upload up to 5 room images</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []).slice(0, 5);
                const validFiles = files.filter((file) => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024);
                if (validFiles.length !== files.length) {
                  toast.error('Only image files up to 5MB each are allowed');
                }
                setSelectedImages(validFiles);
              }}
            />
          </label>
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
              {imagePreviews.map((preview, index) => (
                <div key={`${preview.name}-${index}`} className="relative rounded-xl overflow-hidden border border-border bg-secondary">
                  <img src={preview.url} alt={preview.name} className="w-full h-24 object-cover" />
                  <button
                    type="button"
                    onClick={() => setSelectedImages((prev) => prev.filter((_, fileIndex) => fileIndex !== index))}
                    className="absolute top-2 right-2 rounded-full bg-background/80 p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Facilities</label>
          <div className="flex flex-wrap gap-2">
            {FACILITIES.map((facility) => (
              <button
                key={facility}
                type="button"
                onClick={() => toggleFacility(facility)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${form.facilities.includes(facility) ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
              >
                {facility}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={submitting} className="btn-neon w-full disabled:opacity-60">
          {submitting ? 'Adding...' : 'Add Room'}
        </button>
      </motion.form>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="order-2 relative overflow-hidden rounded-[2rem] border border-border bg-primary min-h-[420px] xl:pl-2"
      >
        <img
          src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"
          alt="Modern rental room interior"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/55 to-primary/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(214,255,226,0.22),transparent_26%)]" />

        <div className="relative z-10 flex h-full flex-col justify-between p-8 text-white">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs backdrop-blur-md">
              <Home className="w-3.5 h-3.5" />
              Listing presentation
            </div>
            <h3 className="mt-5 font-heading text-3xl font-bold leading-tight">
              Make the first impression feel like the room is already move-in ready.
            </h3>
            <p className="mt-4 text-sm text-white/78 max-w-sm">
              Clear images, accurate rent details, and exact location data help your room get approved faster and perform better on Explore.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Visibility</p>
              <p className="mt-2 text-sm font-medium">Approved listings appear on Home, Explore, and Featured Rooms.</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Location</p>
              <p className="mt-2 text-sm font-medium flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                Add accurate coordinates so students can view the room directly on the map.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AddRoomForm;
