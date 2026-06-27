import { useMemo, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { motion } from 'framer-motion';
import { Check, X, CreditCard, FileText, CalendarClock, BadgeCheck, Receipt } from 'lucide-react';
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

const OwnerBookings = () => {
  const {
    user,
    bookings,
    rooms,
    agreements,
    monthlyPaymentRequests,
    paymentTransactions,
    paymentDateChangeRequests,
    updateBookingStatus,
    createMonthlyPaymentRequest,
    acceptAgreement,
    confirmMonthlyPaymentRequest,
    rejectMonthlyPaymentRequest,
    respondToPaymentDateChangeRequest,
    submitUserReport,
    completeBookingStay,
  } = useApp();
  const [requestNotes, setRequestNotes] = useState<Record<string, string>>({});
  const [requestDueDates, setRequestDueDates] = useState<Record<string, string>>({});
  const [ownerResponses, setOwnerResponses] = useState<Record<string, string>>({});
  const [reportCategoryByBooking, setReportCategoryByBooking] = useState<Record<string, string>>({});
  const [reportDetailsByBooking, setReportDetailsByBooking] = useState<Record<string, string>>({});
  const [completingBookingId, setCompletingBookingId] = useState<string | null>(null);

  const myBookings = useMemo(
    () => bookings
      .filter((booking) => booking.owner_id === user?.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [bookings, user?.id],
  );

  const pendingRequests = myBookings.filter((booking) => booking.status === 'pending');
  const activeTenancies = myBookings.filter((booking) => booking.status === 'accepted');
  const bookingHistory = myBookings.filter((booking) => ['completed', 'cancelled', 'rejected'].includes(booking.status));

  const handleBookingStatus = async (bookingId: string, status: 'accepted' | 'rejected') => {
    await updateBookingStatus(bookingId, status);
    toast.success(status === 'accepted' ? 'Booking accepted' : 'Booking rejected');
  };

  const handleCreateMonthlyRequest = async (bookingId: string) => {
    const success = await createMonthlyPaymentRequest(bookingId, {
      dueDate: requestDueDates[bookingId] || undefined,
      note: requestNotes[bookingId] || undefined,
    });
    if (success) {
      toast.success('Monthly payment request sent');
      return;
    }

    toast.error('Monthly payment request could not be created');
  };

  const handleAgreementAccept = async (agreementId: string) => {
    const success = await acceptAgreement(agreementId);
    if (success) {
      toast.success('Agreement confirmed');
      return;
    }

    toast.error('Agreement could not be updated');
  };

  const handleConfirmPayment = async (requestId: string) => {
    const success = await confirmMonthlyPaymentRequest(requestId, ownerResponses[requestId]);
    if (success) {
      toast.success('Monthly payment accepted');
      return;
    }

    toast.error('Monthly payment could not be accepted');
  };

  const handleRejectPayment = async (requestId: string) => {
    const success = await rejectMonthlyPaymentRequest(requestId, ownerResponses[requestId] || 'Please review the payment details again.');
    if (success) {
      toast.success('Payment issue reported');
      return;
    }

    toast.error('Payment issue could not be reported');
  };

  const handleDateChangeResponse = async (requestId: string, status: 'approved' | 'rejected') => {
    const success = await respondToPaymentDateChangeRequest(requestId, status, ownerResponses[requestId]);
    if (success) {
      toast.success(status === 'approved' ? 'Payment date change approved' : 'Payment date change rejected');
      return;
    }

    toast.error('Payment date change response could not be saved');
  };

  const handleReportRenter = async (bookingId: string, renterId: string) => {
    const category = reportCategoryByBooking[bookingId] || 'payment dispute';
    const details = reportDetailsByBooking[bookingId] || '';
    const success = await submitUserReport(bookingId, renterId, category, details);
    if (success) {
      toast.success('Renter report submitted to admin');
      return;
    }

    toast.error('Renter report could not be submitted');
  };

  const handleCompleteStay = async (bookingId: string) => {
    const confirmed = window.confirm('Mark this tenant stay as completed and make the room available again?');
    if (!confirmed) return;

    setCompletingBookingId(bookingId);
    const result = await completeBookingStay(bookingId, 'Stay completed by owner from the dashboard.');
    setCompletingBookingId(null);

    if (result.success) {
      toast.success('Stay completed and moved to booking history');
      return;
    }

    toast.error(result.error || 'Stay could not be completed');
  };

  const renderBookingCard = (booking: typeof myBookings[number], index: number, section: 'pending' | 'active' | 'history') => {
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
    const isPending = section === 'pending';
    const isHistory = section === 'history';

    return (
      <motion.div
        key={booking.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="glass space-y-4 p-4"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <p className="font-heading font-semibold">{booking.student_name}</p>
            <p className="text-sm text-muted-foreground">Wants to book: {room?.title || 'Unknown Room'}</p>
            <p className="mt-1 text-xs text-muted-foreground">{new Date(booking.created_at).toLocaleDateString()}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getBookingBadgeClass(booking.status)}`}>
                {booking.status}
              </span>
              {booking.status === 'accepted' && (
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentBadgeClass(booking.payment_status)}`}>
                  initial payment: {booking.payment_status}
                </span>
              )}
              {booking.payment_reference && (
                <span className="text-xs text-muted-foreground">Ref: {booking.payment_reference}</span>
              )}
              {booking.rent_due_date && isActive && (
                <span className="text-xs text-muted-foreground">Next due: {new Date(booking.rent_due_date).toLocaleDateString()}</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isPending ? (
              <>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => void handleBookingStatus(booking.id, 'accepted')} className="flex w-full items-center justify-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 transition-colors hover:bg-emerald-100 sm:w-auto">
                  <Check className="h-4 w-4" /> Accept
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => void handleBookingStatus(booking.id, 'rejected')} className="flex w-full items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 transition-colors hover:bg-red-100 sm:w-auto">
                  <X className="h-4 w-4" /> Reject
                </motion.button>
              </>
            ) : (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getBookingBadgeClass(booking.status)}`}>
                {booking.status}
              </span>
            )}
            {isActive && (
              <button onClick={() => void handleCompleteStay(booking.id)} disabled={completingBookingId === booking.id} className="btn-neon-outline w-full text-sm disabled:opacity-60 sm:w-auto">
                {completingBookingId === booking.id ? 'Completing...' : 'Tenant Left / Complete Stay'}
              </button>
            )}
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
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${agreement.owner_accepted ? 'status-available' : 'status-pending'}`}>
                  owner: {agreement.owner_accepted ? 'accepted' : 'pending'}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${agreement.student_accepted ? 'status-available' : 'status-pending'}`}>
                  student: {agreement.student_accepted ? 'accepted' : 'pending'}
                </span>
              </div>
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
                <p className="mb-1 text-xs text-muted-foreground">Room</p>
                <p className="font-medium">{room?.title || 'Room'}</p>
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
            {!agreement.owner_accepted && !isHistory && (
              <button onClick={() => void handleAgreementAccept(agreement.id)} className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm text-white transition-colors hover:bg-emerald-700">
                <BadgeCheck className="h-4 w-4" /> Confirm Agreement
              </button>
            )}
          </div>
        )}

        {isActive && (
          <div className="space-y-3 rounded-2xl border border-border/70 bg-secondary/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Monthly Rent Requests</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
              <input
                type="text"
                value={requestNotes[booking.id] || ''}
                onChange={(e) => setRequestNotes((prev) => ({ ...prev, [booking.id]: e.target.value }))}
                placeholder="Optional note for renter"
                className="rounded-xl border border-border bg-background/60 px-4 py-3 text-sm"
              />
              <input
                type="date"
                value={requestDueDates[booking.id] || booking.next_payment_date || ''}
                min={booking.next_payment_date || booking.rent_due_date || undefined}
                onChange={(e) => setRequestDueDates((prev) => ({ ...prev, [booking.id]: e.target.value }))}
                className="rounded-xl border border-border bg-background/60 px-4 py-3 text-sm"
              />
              <button onClick={() => void handleCreateMonthlyRequest(booking.id)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90 md:w-auto">
                <CreditCard className="h-4 w-4" /> Send Monthly Request
              </button>
            </div>
            {monthlyRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No monthly requests have been sent yet.</p>
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
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getPaymentBadgeClass(request.status)}`}>
                        {request.status}
                      </span>
                      {request.paid_at && (
                        <span className="text-xs text-muted-foreground">
                          Paid {new Date(request.paid_at).toLocaleDateString()}
                        </span>
                      )}
                      {request.status === 'owner_confirmation_pending' && (
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={ownerResponses[request.id] || ''}
                            onChange={(e) => setOwnerResponses((prev) => ({ ...prev, [request.id]: e.target.value }))}
                            placeholder="Confirmation note or issue detail"
                            className="rounded-xl border border-border bg-background/60 px-3 py-2 text-xs"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => void handleConfirmPayment(request.id)} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm text-white transition-colors hover:bg-emerald-700">
                              Accept Payment
                            </button>
                            <button onClick={() => void handleRejectPayment(request.id)} className="rounded-xl bg-secondary px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary/80">
                              Report Issue
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {isActive && activeDateChangeRequest && (
          <div className="space-y-3 rounded-2xl border border-border/70 bg-secondary/20 p-4">
            <p className="text-sm font-semibold">Payment Date Change Request</p>
            <p className="text-sm text-muted-foreground">
              Requested move from {new Date(activeDateChangeRequest.current_due_date).toLocaleDateString()} to {new Date(activeDateChangeRequest.requested_due_date).toLocaleDateString()}.
            </p>
            <input
              type="text"
              value={ownerResponses[activeDateChangeRequest.id] || ''}
              onChange={(e) => setOwnerResponses((prev) => ({ ...prev, [activeDateChangeRequest.id]: e.target.value }))}
              placeholder="Add a response note"
              className="w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-sm"
            />
            <div className="flex gap-2">
              <button onClick={() => void handleDateChangeResponse(activeDateChangeRequest.id, 'approved')} className="btn-neon text-sm">
                Approve New Date
              </button>
              <button onClick={() => void handleDateChangeResponse(activeDateChangeRequest.id, 'rejected')} className="btn-neon-outline text-sm">
                Reject Request
              </button>
            </div>
          </div>
        )}

        {isActive && (
          <div className="space-y-3 rounded-2xl border border-border/70 bg-secondary/20 p-4">
            <p className="text-sm font-semibold">Report Renter</p>
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
            <button onClick={() => void handleReportRenter(booking.id, booking.student_id)} className="btn-neon-outline text-sm">
              Submit Renter Report
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
            This booking is now in history and no longer counts as an active tenant.
          </p>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-4 font-heading text-xl font-semibold">Pending Requests ({pendingRequests.length})</h2>
        {pendingRequests.length === 0 ? (
          <div className="glass p-6 text-sm text-muted-foreground">No pending booking requests right now.</div>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map((booking, index) => renderBookingCard(booking, index, 'pending'))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-4 font-heading text-lg font-semibold">Active Tenants ({activeTenancies.length})</h3>
        {activeTenancies.length === 0 ? (
          <div className="glass p-6 text-sm text-muted-foreground">No active tenants at the moment.</div>
        ) : (
          <div className="space-y-4">
            {activeTenancies.map((booking, index) => renderBookingCard(booking, index, 'active'))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-4 font-heading text-lg font-semibold">Booking History ({bookingHistory.length})</h3>
        {bookingHistory.length === 0 ? (
          <div className="glass p-6 text-sm text-muted-foreground">No booking history yet.</div>
        ) : (
          <div className="space-y-4">
            {bookingHistory.map((booking, index) => renderBookingCard(booking, index, 'history'))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerBookings;
