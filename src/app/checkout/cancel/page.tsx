export default function CheckoutCancelPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-12 text-center text-gray-900">
      <div className="max-w-md space-y-4">
        <h1 className="text-3xl font-semibold">Payment Cancelled</h1>
        <p className="text-sm text-gray-600">Your checkout session was cancelled. You can return to try again at any time.</p>
      </div>
    </div>
  );
}
