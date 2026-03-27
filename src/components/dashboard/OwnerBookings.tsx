import { useApp } from '@/contexts/AppContext';
import { motion } from 'framer-motion';
import { Check, X, CreditCard, FileText, CalendarClock, BadgeCheck, Receipt } from 'lucide-react';
import { toast } from 'sonner';

const OwnerBookings = () => {
  const {
    user,
    bookings,
    rooms,
    agreements,
    monthlyPaymentRequests,
    paymentTransactions,
    updateBookingStatus,
    createMonthlyPaymentRequest,
    acceptAgreement,
    confirmMonthlyPaymentRequest,
  } = useApp();

  const myBookings = bookings.filter((booking) => booking.owner_id === user?.id);

  const handleBookingStatus = async (bookingId: string, status: 'accepted' | 'rejected') => {
    await updateBookingStatus(bookingId, status);
    toast.success(status === 'accepted' ? 'Booking accepted' : 'Booking rejected');
  };

  const handleCreateMonthlyRequest = async (bookingId: string) => {
    const success = await createMonthlyPaymentRequest(bookingId);
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
    const success = await confirmMonthlyPaymentRequest(requestId);
    if (success) {
      toast.success('Monthly payment accepted');
      return;
    }

    toast.error('Monthly payment could not be accepted');
  };

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold mb-4">Booking Requests ({myBookings.length})</h2>
      {myBookings.length === 0 ? (
        <div className="glass p-8 text-center text-muted-foreground">No booking requests yet.</div>
      ) : (
        <div className="space-y-4">
          {myBookings.map((booking, index) => {
            const room = rooms.find((item) => item.id === booking.room_id);
            const agreement = agreements.find((item) => item.booking_id === booking.id);
            const monthlyRequests = monthlyPaymentRequests
              .filter((item) => item.booking_id === booking.id)
              .sort((a, b) => b.due_month.localeCompare(a.due_month));
            const transactions = paymentTransactions
              .filter((item) => item.booking_id === booking.id)
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            const agreementEndDate = agreement
              ? new Date(new Date(agreement.start_date).getFullYear(), new Date(agreement.start_date).getMonth() + agreement.duration_months, new Date(agreement.start_date).getDate())
              : null;

            return (
              <motion.div key={booking.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="glass p-4 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <p className="font-heading font-semibold">{booking.student_name}</p>
                    <p className="text-sm text-muted-foreground">Wants to book: {room?.title || 'Unknown Room'}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(booking.created_at).toLocaleDateString()}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${booking.status === 'pending' ? 'status-pending' : booking.status === 'accepted' ? 'status-available' : 'status-occupied'}`}>
                        {booking.status}
                      </span>
                      {booking.status === 'accepted' && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${booking.payment_status === 'paid' ? 'status-available' : booking.payment_status === 'failed' ? 'status-occupied' : 'status-pending'}`}>
                          initial payment: {booking.payment_status}
                        </span>
                      )}
                      {booking.payment_reference && (
                        <span className="text-xs text-muted-foreground">Ref: {booking.payment_reference}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {booking.status === 'pending' ? (
                      <>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => void handleBookingStatus(booking.id, 'accepted')} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors text-sm">
                          <Check className="w-4 h-4" /> Accept
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => void handleBookingStatus(booking.id, 'rejected')} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors text-sm">
                          <X className="w-4 h-4" /> Reject
                        </motion.button>
                      </>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${booking.status === 'accepted' ? 'status-available' : 'status-occupied'}`}>
                        {booking.status}
                      </span>
                    )}
                  </div>
                </div>

                {agreement && (
                  <div className="rounded-2xl border border-border/70 bg-secondary/40 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" /> Rental Agreement
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Start {new Date(agreement.start_date).toLocaleDateString()} • End {agreementEndDate?.toLocaleDateString() || 'TBD'}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${agreement.owner_accepted ? 'status-available' : 'status-pending'}`}>
                          owner: {agreement.owner_accepted ? 'accepted' : 'pending'}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${agreement.student_accepted ? 'status-available' : 'status-pending'}`}>
                          student: {agreement.student_accepted ? 'accepted' : 'pending'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="rounded-xl bg-background/60 border border-border/50 p-3">
                        <p className="text-xs text-muted-foreground mb-1">Monthly Rent</p>
                        <p className="font-medium">Rs{agreement.monthly_rent.toLocaleString()}</p>
                      </div>
                      <div className="rounded-xl bg-background/60 border border-border/50 p-3">
                        <p className="text-xs text-muted-foreground mb-1">Duration</p>
                        <p className="font-medium">{agreement.duration_months} months</p>
                      </div>
                      <div className="rounded-xl bg-background/60 border border-border/50 p-3">
                        <p className="text-xs text-muted-foreground mb-1">Room</p>
                        <p className="font-medium">{room?.title || 'Room'}</p>
                      </div>
                    </div>
                    <div className="rounded-xl bg-background/60 border border-border/50 p-3">
                      <p className="text-xs text-muted-foreground mb-2">Agreement Summary</p>
                      <pre className="whitespace-pre-wrap text-xs text-muted-foreground">{agreement.content}</pre>
                    </div>
                    <div className="rounded-xl bg-background/60 border border-border/50 p-3">
                      <p className="text-xs text-muted-foreground mb-2">Rules</p>
                      <div className="space-y-1 text-sm">
                        {agreement.rules.map((rule) => (
                          <p key={rule}>• {rule}</p>
                        ))}
                      </div>
                    </div>
                    {!agreement.owner_accepted && (
                      <button onClick={() => void handleAgreementAccept(agreement.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm">
                        <BadgeCheck className="w-4 h-4" /> Confirm Agreement
                      </button>
                    )}
                  </div>
                )}

                {booking.status === 'accepted' && (
                  <div className="rounded-2xl border border-border/70 bg-secondary/30 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="w-4 h-4 text-primary" />
                        <p className="text-sm font-semibold">Monthly Rent Requests</p>
                      </div>
                      <button onClick={() => void handleCreateMonthlyRequest(booking.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm">
                        <CreditCard className="w-4 h-4" /> Send Monthly Request
                      </button>
                    </div>
                    {monthlyRequests.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No monthly requests have been sent yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {monthlyRequests.map((request) => (
                          <div key={request.id} className="rounded-xl border border-border/60 bg-background/50 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">
                                {new Date(request.due_month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Due {new Date(request.due_date).toLocaleDateString()} • Rs{request.amount.toLocaleString()}
                              </p>
                              {request.payment_reference && (
                                <p className="text-xs text-muted-foreground">Ref: {request.payment_reference}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${request.status === 'accepted' ? 'status-available' : 'status-pending'}`}>
                                {request.status}
                              </span>
                              {request.paid_at && (
                                <span className="text-xs text-muted-foreground">
                                  Paid {new Date(request.paid_at).toLocaleDateString()}
                                </span>
                              )}
                              {request.status === 'paid' && (
                                <button onClick={() => void handleConfirmPayment(request.id)} className="px-3 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm">
                                  Accept Payment
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-primary" />
                    <p className="text-sm font-semibold">Payment History</p>
                  </div>
                  {transactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No payment records yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="rounded-xl border border-border/60 bg-background/50 p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium capitalize">{transaction.kind.replace('_', ' ')}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleString()} • {transaction.provider} • {transaction.reference}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${transaction.status === 'paid' ? 'status-available' : transaction.status === 'failed' ? 'status-occupied' : 'status-pending'}`}>
                              {transaction.status}
                            </span>
                            <span className="text-sm font-medium">Rs{transaction.amount.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OwnerBookings;
