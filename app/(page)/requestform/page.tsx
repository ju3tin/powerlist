// app/request-access/page.tsx
// (or wherever you want the form to live)

import PowerlistApplicationForm from "@/app/components/PowerlistApplicationForm";

export default function RequestAccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Not on the Powerlist?
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Fill in your details below and we’ll create your profile with{" "}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">
              Auth: none
            </code>
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <PowerlistApplicationForm />
        </div>
      </div>
    </div>
  );
}