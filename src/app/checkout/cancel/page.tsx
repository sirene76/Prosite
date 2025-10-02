export default function CancelPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold text-red-600">Payment Canceled ❌</h1>
      <p className="mt-4">You have not been charged. Feel free to try again when ready.</p>
    </div>
  );
}
