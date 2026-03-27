import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Star, ChevronLeft, ChevronRight, Heart, Navigation, Wifi, Wind, Car, Zap, Utensils, Dumbbell, Shield, Flame } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/contexts/AppContext';
import RoomLocationMap from '@/components/RoomLocationMap';

const facilityIconMap: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="w-5 h-5" />,
  AC: <Wind className="w-5 h-5" />,
  Parking: <Car className="w-5 h-5" />,
  'Power Backup': <Zap className="w-5 h-5" />,
  Kitchen: <Utensils className="w-5 h-5" />,
  Gym: <Dumbbell className="w-5 h-5" />,
  CCTV: <Shield className="w-5 h-5" />,
  Geyser: <Flame className="w-5 h-5" />,
};

const RoomDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    rooms,
    roomsLoaded,
    roomsError,
    user,
    profile,
    bookRoom,
    wishlist,
    toggleWishlist,
    bookings,
    wishlistLoaded,
    roomReviews,
    fetchReviews,
    submitReview,
    submitRoomReport,
  } = useApp();

  const room = rooms.find((item) => item.id === id);
  const [imgIdx, setImgIdx] = useState(0);
  const [showMap, setShowMap] = useState(false);
  const [booking, setBooking] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('Misleading information');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  useEffect(() => {
    if (room?.id) {
      void fetchReviews(room.id);
    }
  }, [fetchReviews, room?.id]);

  const existingBooking = user ? bookings.find((entry) => entry.room_id === room?.id && entry.student_id === user.id && entry.status !== 'rejected') : null;
  const acceptedBooking = user ? bookings.find((entry) => entry.room_id === room?.id && entry.student_id === user.id && entry.status === 'accepted') : null;
  const existingReview = useMemo(
    () => roomReviews.find((review) => review.booking_id === acceptedBooking?.id),
    [acceptedBooking?.id, roomReviews],
  );
  const canViewRoom = room && (
    room.approvalStatus === 'approved'
    || profile?.role === 'admgit commit -m "first commit"in'
    || room.owner_id === user?.id
  );

  useEffect(() => {
    if (existingReview) {
      setReviewRating(existingReview.rating);
      setReviewComment(existingReview.comment);
    }
  }, [existingReview]);

  if (!roomsLoaded) {
    return <div className="min-h-screen pt-20 flex items-center justify-center"><p className="text-muted-foreground">Loading room...</p></div>;
  }

  if (roomsError) {
    return <div className="min-h-screen pt-20 flex items-center justify-center px-4"><p className="text-center text-muted-foreground">Room data could not be loaded from Supabase: {roomsError}</p></div>;
  }

  if (!room || !canViewRoom) {
    return <div className="min-h-screen pt-20 flex items-center justify-center px-4"><p className="text-center text-muted-foreground">Room not found in the current Supabase data. If you just created it, make sure the room row was saved successfully.</p></div>;
  }

  const isWishlisted = wishlist.includes(room.id);

  const handleBook = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (profile?.role !== 'student') {
      toast.error('Only students can book rooms');
      return;
    }
    if (existingBooking) {
      toast.info('You already have a booking for this room');
      return;
    }
    if (room.status === 'occupied') {
      toast.error('This room is currently occupied');
      return;
    }
    if (room.approvalStatus !== 'approved') {
      toast.error('This room is not approved for booking yet');
      return;
    }

    setBooking(true);
    const success = await bookRoom(room.id);
    if (success) {
      toast.success('Booking request sent!');
    } else {
      toast.error('Failed to send booking request');
    }
    setBooking(false);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedBooking) {
      toast.error('You can review only after your booking is accepted');
      return;
    }

    setReviewSubmitting(true);
    const success = await submitReview(acceptedBooking.id, reviewRating, reviewComment.trim());
    if (success) {
      toast.success(existingReview ? 'Review updated' : 'Review submitted');
    } else {
      toast.error('Failed to save review');
    }
    setReviewSubmitting(false);
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/auth');
      return;
    }

    setReportSubmitting(true);
    const success = await submitRoomReport(room.id, reportReason, reportDetails.trim());
    setReportSubmitting(false);

    if (success) {
      toast.success('Report submitted to admin');
      setReportDetails('');
      setShowReportForm(false);
      return;
    }

    toast.error('Failed to submit report');
  };

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container mx-auto px-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative rounded-2xl overflow-hidden h-64 md:h-96">
              <img src={room.images[imgIdx] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'} alt={room.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
              {room.images.length > 1 && (
                <>
                  <button onClick={() => setImgIdx((index) => (index - 1 + room.images.length) % room.images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full glass hover:bg-secondary transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setImgIdx((index) => (index + 1) % room.images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full glass hover:bg-secondary transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                {room.images.map((_, index) => (
                  <button key={index} onClick={() => setImgIdx(index)} className={`w-2 h-2 rounded-full transition-all ${index === imgIdx ? 'bg-primary w-6' : 'bg-foreground/40'}`} />
                ))}
              </div>
            </motion.div>

            {room.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide">
                {room.images.map((img, index) => (
                  <button key={index} onClick={() => setImgIdx(index)} className={`flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all ${index === imgIdx ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="glass p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${room.status === 'available' ? 'status-available' : 'status-occupied'}`}>
                      {room.status}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">{room.roomType}</span>
                    {room.approvalStatus !== 'approved' && (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${room.approvalStatus === 'rejected' ? 'bg-destructive/10 text-destructive' : 'status-pending'}`}>
                        {room.approvalStatus === 'rejected' ? 'rejected' : 'pending review'}
                      </span>
                    )}
                  </div>
                  <h1 className="font-heading text-2xl font-bold mb-1">{room.title}</h1>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{room.area}, {room.city}</span>
                    {room.college && <span className="ml-2 text-primary">• {room.college}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="font-heading font-bold">{room.rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({room.reviewCount})</span>
                </div>
              </div>
              <p className="text-muted-foreground mb-6">{room.description}</p>

              <h3 className="font-heading font-semibold mb-3">Facilities</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {room.facilities.map((facility) => (
                  <div key={facility} className="flex items-center gap-2 p-3 rounded-xl bg-secondary">
                    <span className="text-primary">{facilityIconMap[facility] || <Wifi className="w-5 h-5" />}</span>
                    <span className="text-sm">{facility}</span>
                  </div>
                ))}
              </div>

              {room.nearbyPlaces && room.nearbyPlaces.length > 0 && (
                <>
                  <h3 className="font-heading font-semibold mb-3">Nearby Places</h3>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {room.nearbyPlaces.map((place) => (
                      <span key={place} className="px-3 py-1.5 rounded-full text-xs bg-secondary text-muted-foreground">{place}</span>
                    ))}
                  </div>
                </>
              )}

              <button onClick={() => setShowMap(!showMap)} className="btn-neon-outline text-sm py-2 flex items-center gap-2 mb-4">
                <Navigation className="w-4 h-4" /> {showMap ? 'Hide Map' : 'See Distance & Map'}
              </button>
              {showMap && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                  <RoomLocationMap
                    latitude={room.latitude}
                    longitude={room.longitude}
                    title={room.title}
                    area={room.area}
                    city={room.city}
                  />
                </motion.div>
              )}
            </div>

            <div className="glass p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-xl font-semibold">Reviews</h2>
                  <p className="text-sm text-muted-foreground">{room.reviewCount} review{room.reviewCount !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium">{room.rating.toFixed(1)}</span>
                </div>
              </div>

              {profile?.role === 'student' && acceptedBooking && (
                <form onSubmit={handleReviewSubmit} className="rounded-2xl bg-secondary/50 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading font-semibold">{existingReview ? 'Update Your Review' : 'Write a Review'}</h3>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setReviewRating(value)}
                          className="p-1"
                        >
                          <Star className={`w-5 h-5 ${value <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience with this room"
                    className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                  <button type="submit" disabled={reviewSubmitting} className="btn-neon disabled:opacity-50">
                    {reviewSubmitting ? 'Saving...' : existingReview ? 'Update Review' : 'Submit Review'}
                  </button>
                </form>
              )}

              {roomReviews.length === 0 ? (
                <div className="text-sm text-muted-foreground">No reviews yet. Be the first to share feedback after your stay.</div>
              ) : (
                <div className="space-y-4">
                  {roomReviews.map((review) => (
                    <div key={review.id} className="rounded-2xl border border-border p-4">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <p className="font-medium">{review.student_name}</p>
                          <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star key={index} className={`w-4 h-4 ${index < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{review.comment || 'No written comment provided.'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-strong p-6 sticky top-24">
              <div className="mb-6">
                <span className="text-3xl font-heading font-bold gradient-text">Rs{room.price.toLocaleString()}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Room Type</span>
                  <span className="font-medium capitalize">{room.roomType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className={`font-medium capitalize ${room.status === 'available' ? 'text-emerald-600' : 'text-red-500'}`}>{room.status}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Review Status</span>
                  <span className={`font-medium capitalize ${room.approvalStatus === 'approved' ? 'text-emerald-600' : room.approvalStatus === 'rejected' ? 'text-destructive' : 'text-amber-600'}`}>
                    {room.approvalStatus === 'approved' ? 'Approved' : room.approvalStatus === 'rejected' ? 'Rejected' : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Owner</span>
                  <span className="font-medium">{room.ownerName}</span>
                </div>
              </div>
              {room.approvalStatus !== 'approved' && (
                <p className="mb-4 text-xs text-muted-foreground">
                  {room.approvalStatus === 'pending'
                    ? 'This listing is waiting for admin approval and cannot receive new bookings yet.'
                    : 'This listing was rejected by admin and cannot receive new bookings.'}
                </p>
              )}
              <div className="space-y-3">
                <button onClick={handleBook} disabled={room.status === 'occupied' || room.approvalStatus !== 'approved' || !!existingBooking || booking} className="btn-neon w-full disabled:opacity-50 disabled:cursor-not-allowed">
                  {booking ? 'Sending...' : existingBooking ? `Booking ${existingBooking.status}` : room.approvalStatus !== 'approved' ? 'Awaiting Approval' : room.status === 'occupied' ? 'Currently Occupied' : 'Book Now'}
                </button>
                {profile?.role === 'student' && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => void toggleWishlist(room.id)} disabled={!wishlistLoaded} className="btn-neon-outline w-full flex items-center justify-center gap-2 disabled:opacity-50">
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                    {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  </motion.button>
                )}
                {profile?.role !== 'admin' && (
                  <button onClick={() => setShowReportForm((prev) => !prev)} className="btn-neon-outline w-full">
                    {showReportForm ? 'Cancel Report' : 'Report Listing'}
                  </button>
                )}
              </div>
              {showReportForm && (
                <form onSubmit={handleReportSubmit} className="mt-4 space-y-3 rounded-2xl bg-secondary/50 p-4">
                  <div>
                    <label className="text-xs uppercase tracking-wide text-muted-foreground">Reason</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option>Misleading information</option>
                      <option>Fake photos</option>
                      <option>Unsafe listing</option>
                      <option>Spam or scam</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wide text-muted-foreground">Details</label>
                    <textarea
                      rows={3}
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Tell admin what looks wrong with this listing"
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <button type="submit" disabled={reportSubmitting} className="btn-neon w-full disabled:opacity-60">
                    {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetails;
