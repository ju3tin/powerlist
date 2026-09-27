import LinkedInLoginButton from "@/components/LinkedInLoginButton"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome</h1>
          <p className="mt-2 text-gray-600">Sign in to continue</p>
        </div>

        <div className="mt-8">
          <LinkedInLoginButton />
        </div>
      </div>
    </div>
  )
}