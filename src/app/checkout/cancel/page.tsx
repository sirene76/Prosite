export default function CancelPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold text-red-600 mb-4">
        ❌ Payment Cancelled
      </h1>
      <p>Your payment was cancelled. Please try again if you still want to upgrade.</p>
    </div>
  );
}
