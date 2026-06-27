import { useMemo, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MessageCircle, Eye, CreditCard, FileText, BadgeCheck, CalendarClock, Receipt, CircleAlert } from 'lucide-react';
import { toast } from 'sonner';

const getBookingBadgeClass = (status: string) => {
  switch (status) {
    case 'accepted':
      return 'status-available';
    case 'pending':
      return 'status-pending';
    default:
      return 'status-occupied';
  }
};

const getPaymentBadgeClass = (status?: string) => {
  switch (status) {
    case 'paid':
    case 'accepted':
      return 'status-available';
    case 'failed':
    case 'cancelled':
      return 'status-occupied';
    default:
      return 'status-pending';
  }
};

const StudentBookings = () => {
  const {
    user,
    bookings,
    rooms,
    agreements,
    monthlyPaymentRequests,
    paymentTransactions,
    paymentDateChangeRequests,
    completeBookingPayment,
    acceptAgreement,
    payMonthlyPaymentRequest,
    requestPaymentDateChange,
    submitUserReport,
  } = useApp();
  const [requestedDates, setRequestedDates] = useState<Record<string, string>>({});
  const [dateChangeReasons, setDateChangeReasons] = useState<Record<string, string>>({});
  const [reportDetailsByBooking, setReportDetailsByBooking] = useState<Record<string, string>>({});
  const [reportCategoryByBooking, setReportCategoryByBooking] = useState<Record<string, string>>({});
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const [activeInitialPaymentId, setActiveInitialPaymentId] = useState<string | null>(null);

  const myBookings = useMemo(
    () => bookings
      .filter((booking) => booking.student_id === user?.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [bookings, user?.id],
  );

  const activeBookings = myBookings.filter((booking) => booking.status === 'accepted');
  const requestBookings = myBookings.filter((booking) => booking.status === 'pending');
  const bookingHistory = myBookings.filter((booking) => ['completed', 'cancelled', 'rejected'].includes(booking.status));

  const handleInitialPayment = async (bookingId: string) => {
    if (activeInitialPaymentId === bookingId) return;
    setActiveInitialPaymentId(bookingId);
    const success = await completeBookingPayment(bookingId);
    setActiveInitialPaymentId(null);
    if (success.success) {
      toast.success('Initial payment completed successfully');
      return;
    }

    toast.error(success.error || 'Initial payment could not be completed');
  };

  const handleAgreementAccept = async (agreementId: string) => {
    const success = await acceptAgreement(agreementId);
    if (success) {
      toast.success('Agreement accepted');
      return;
    }

    toast.error('Agreement could not be accepted');
  };

  const handleMonthlyPayment = async (requestId: string) => {
    if (activePaymentId === requestId) return;
    setActivePaymentId(requestId);
    const success = await payMonthlyPaymentRequest(requestId);
    setActivePaymentId(null);
    if (success.success) {
      toast.success('Monthly rent payment completed');
      return;
    }

    toast.error(success.error || 'Monthly payment could not be completed');
  };

  const handleDateChangeRequest = async (bookingId: string) => {
    const requestedDueDate = requestedDates[bookingId];
    const reason = dateChangeReasons[bookingId] || '';
    if (!requestedDueDate) {
      toast.error('Choose a new due date');
      return;
    }

    const success = await requestPaymentDateChange(bookingId, requestedDueDate, reason);
    if (success) {
      toast.success('Payment date change request sent');
      return;
    }

    toast.error('Payment date change request could not be sent');
  };

  const handleReportOwner = async (bookingId: string, ownerId: string) => {
    const category = reportCategoryByBooking[bookingId] || 'payment dispute';
    const details = reportDetailsByBooking[bookingId] || '';
    const success = await submitUserReport(bookingId, ownerId, category, details);
    if (success) {
      toast.success('Owner report submitted to admin');
      return;
    }

    toast.error('Owner report could not be submitted');
  };

  const renderBookingCard = (booking: typeof myBookings[number], index: number, section: 'active' | 'requests' | 'history') => {
    const room = rooms.find((item) => item.id === booking.room_id);
    const agreement = agreements.find((item) => item.booking_id === booking.id);
    const monthlyRequests = monthlyPaymentRequests
      .filter((item) => item.booking_id === booking.id)
      .sort((a, b) => b.due_month.localeCompare(a.due_month));
    const transactions = paymentTransactions
      .filter((item) => item.booking_id === booking.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const activeDateChangeRequest = paymentDateChangeRequests.find((item) => item.booking_id === booking.id && item.status === 'pending');
    const agreementEndDate = agreement
      ? new Date(new Date(agreement.start_date).getFullYear(), new Date(agreement.start_date).getMonth() + agreement.duration_months, new Date(agreement.start_date).getDate())
      : null;
    const isActive = section === 'active';
    const isHistory = section === 'history';

    return (
      <motion.div
        key={booking.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="glass space-y-4 p-4"
      >
        <div className="flex flex-col gap-4 md:flex-row">
          {room && <img src={room.images[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'} alt={room.title} className="h-28 w-full rounded-xl object-cover md:w-40" />}
          <div className="flex-1">
            <h3 className="font-heading font-semibold">{room?.title || 'Room'}</h3>
            <p className="text-sm text-muted-foreground">{room?.area}, {room?.city} - Rs{room?.price.toLocaleString()}/mo</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getBookingBadgeClass(booking.status)}`}>
                {booking.status}
              </span>
              {booking.status === 'accepted' && (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentBadgeClass(booking.payment_status)}`}>
                  initial payment: {booking.payment_status}
                </span>
              )}
              {isActive && (
                <span className="flex items-center gap-1 text-xs text-primary">
                  <MessageCircle className="h-3 w-3" /> Chat enabled
                </span>
              )}
            </div>
            {booking.payment_reference && (
              <p className="mt-2 text-xs text-muted-foreground">Initial payment ref: {booking.payment_reference}</p>
            )}
            {booking.rent_due_date && isActive && (
              <p className="mt-2 text-xs text-muted-foreground">Next rent due: {new Date(booking.rent_due_date).toLocaleDateString()}</p>
            )}
            {booking.payment_status === 'failed' && isActive && (
              <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
                <CircleAlert className="h-3 w-3" /> Last payment attempt failed. Please try again.
              </p>
            )}
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            {isActive && booking.payment_status !== 'paid' && (
              <button onClick={() => void handleInitialPayment(booking.id)} disabled={activeInitialPaymentId === booking.id} className="flex w-full items-center justify-center gap-1 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 sm:w-auto">
                <CreditCard className="h-4 w-4" /> {activeInitialPaymentId === booking.id ? 'Opening...' : 'Proceed to Payment'}
              </button>
            )}
            <Link to={`/rooms/${booking.room_id}`} className="flex items-center justify-center rounded-xl bg-secondary p-2 transition-colors hover:bg-secondary/80">
              <Eye className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {agreement && (
          <div className="space-y-3 rounded-2xl border border-border/70 bg-secondary/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <FileText className="h-4 w-4 text-primary" /> Rental Agreement
                </p>
                <p className="text-xs text-muted-foreground">
                  Start {new Date(agreement.start_date).toLocaleDateString()} - End {agreementEndDate?.toLocaleDateString() || 'TBD'}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${agreement.student_accepted ? 'status-available' : 'status-pending'}`}>
                {agreement.student_accepted ? 'accepted' : 'pending acceptance'}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-3">
              <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                <p className="mb-1 text-xs text-muted-foreground">Monthly Rent</p>
                <p className="font-medium">Rs{agreement.monthly_rent.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                <p className="mb-1 text-xs text-muted-foreground">Duration</p>
                <p className="font-medium">{agreement.duration_months} months</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                <p className="mb-1 text-xs text-muted-foreground">PDF Ready</p>
                <p className="font-medium">Structured content stored</p>
              </div>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/60 p-3">
              <p className="mb-2 text-xs text-muted-foreground">Agreement Summary</p>
              <pre className="whitespace-pre-wrap text-xs text-muted-foreground">{agreement.content}</pre>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/60 p-3">
              <p className="mb-2 text-xs text-muted-foreground">Rules</p>
              <div className="space-y-1 text-sm">
                {agreement.rules.map((rule) => (
                  <p key={rule}>- {rule}</p>
                ))}
              </div>
            </div>
            {isActive && !agreement.student_accepted && (
              <button onClick={() => void handleAgreementAccept(agreement.id)} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white transition-colors hover:bg-emerald-700">
                <BadgeCheck className="h-4 w-4" /> Accept Agreement
              </button>
            )}
          </div>
        )}

        {isActive && (
          <div className="space-y-3 rounded-2xl border border-border/70 bg-secondary/30 p-4">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" />
              <p className="text-sm font-semibold">Monthly Rent Cycle</p>
            </div>
            {monthlyRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No monthly rent request has been generated yet.</p>
            ) : (
              <div className="space-y-2">
                {monthlyRequests.map((request) => (
                  <div key={request.id} className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/50 p-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(request.due_month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due {new Date(request.due_date).toLocaleDateString()} - Rs{request.amount.toLocaleString()}
                      </p>
                      {request.payment_reference && (
                        <p className="text-xs text-muted-foreground">Ref: {request.payment_reference}</p>
                      )}
                      {request.note && (
                        <p className="text-xs text-muted-foreground">Note: {request.note}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentBadgeClass(request.status)}`}>
                        {request.status}
                      </span>
                      {(request.status === 'pending' || request.status === 'failed') && (
                        <button onClick={() => void handleMonthlyPayment(request.id)} disabled={activePaymentId === request.id} className="flex w-full items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 sm:w-auto">
                          <CreditCard className="h-4 w-4" /> {activePaymentId === request.id ? 'Processing...' : 'Pay Rent'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isActive && (
          <div className="space-y-3 rounded-2xl border border-border/70 bg-secondary/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">Payment Date Change</p>
              {activeDateChangeRequest && (
                <span className="status-pending rounded-full px-3 py-1 text-xs font-semibold">request pending</span>
              )}
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                type="date"
                value={requestedDates[booking.id] || ''}
                min={booking.rent_due_date || undefined}
                onChange={(e) => setRequestedDates((prev) => ({ ...prev, [booking.id]: e.target.value }))}
                className="rounded-xl border border-border bg-background/60 px-4 py-3 text-sm"
              />
              <input
                type="text"
                value={dateChangeReasons[booking.id] || ''}
                onChange={(e) => setDateChangeReasons((prev) => ({ ...prev, [booking.id]: e.target.value }))}
                placeholder="Reason for date change"
                className="rounded-xl border border-border bg-background/60 px-4 py-3 text-sm"
              />
            </div>
            <button onClick={() => void handleDateChangeRequest(booking.id)} disabled={!!activeDateChangeRequest} className="btn-neon-outline text-sm disabled:opacity-50">
              Request New Payment Date
            </button>
          </div>
        )}

        {isActive && (
          <div className="space-y-3 rounded-2xl border border-border/70 bg-secondary/20 p-4">
            <p className="text-sm font-semibold">Report Owner</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
              <select
                value={reportCategoryByBooking[booking.id] || 'payment dispute'}
                onChange={(e) => setReportCategoryByBooking((prev) => ({ ...prev, [booking.id]: e.target.value }))}
                className="rounded-xl border border-border bg-background/60 px-4 py-3 text-sm"
              >
                <option value="payment dispute">Payment dispute</option>
                <option value="fraud">Fraud</option>
                <option value="harassment">Harassment</option>
                <option value="other issue">Other issue</option>
              </select>
              <input
                type="text"
                value={reportDetailsByBooking[booking.id] || ''}
                onChange={(e) => setReportDetailsByBooking((prev) => ({ ...prev, [booking.id]: e.target.value }))}
                placeholder="Describe the issue"
                className="rounded-xl border border-border bg-background/60 px-4 py-3 text-sm"
              />
            </div>
            <button onClick={() => void handleReportOwner(booking.id, booking.owner_id)} className="btn-neon-outline text-sm">
              Submit Owner Report
            </button>
          </div>
        )}

        <div className="space-y-3 rounded-2xl border border-border/70 bg-secondary/20 p-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold">Payment History</p>
          </div>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payment records yet.</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background/50 p-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium capitalize">{transaction.kind.replace('_', ' ')}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleString()} - {transaction.provider} - {transaction.reference}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentBadgeClass(transaction.status)}`}>
                      {transaction.status}
                    </span>
                    <span className="text-sm font-medium">Rs{transaction.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isHistory && (
          <p className="text-xs text-muted-foreground">
            This booking is now part of your history and no longer appears in active stays.
          </p>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 font-heading text-xl font-semibold">Current Stays ({activeBookings.length})</h2>
        {activeBookings.length === 0 ? (
          <div className="glass p-6 text-sm text-muted-foreground">No active accepted stays right now.</div>
        ) : (
          <div className="space-y-4">
            {activeBookings.map((booking, index) => renderBookingCard(booking, index, 'active'))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-4 font-heading text-lg font-semibold">Request Updates ({requestBookings.length})</h3>
        {requestBookings.length === 0 ? (
          <div className="glass p-6 text-sm text-muted-foreground">No pending booking requests.</div>
        ) : (
          <div className="space-y-4">
            {requestBookings.map((booking, index) => renderBookingCard(booking, index, 'requests'))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-4 font-heading text-lg font-semibold">Booking History ({bookingHistory.length})</h3>
        {bookingHistory.length === 0 ? (
          <div className="glass p-6 text-sm text-muted-foreground">
            No history yet. <Link to="/rooms" className="text-primary hover:underline">Explore rooms</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookingHistory.map((booking, index) => renderBookingCard(booking, index, 'history'))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentBookings;
