"use client";

export default function LoginPage() {
  const handleLogin = () => {
    window.location.href = "/api/linkedin/login";
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-8">

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black">
              Innovate Finance
            </h1>

            <p className="mt-2 text-gray-600">
              Sign in with LinkedIn
            </p>
          </div>

          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-[#0A66C2] hover:bg-[#004182] text-white font-semibold py-3 px-4 rounded-lg transition"
          >
            <span className="text-xl font-bold">in</span>
            Continue with LinkedIn
          </button>

          <p className="text-xs text-gray-500 text-center mt-6">
            Sign in using your LinkedIn account to continue.
          </p>

        </div>
      </div>
    </main>
  );
}