
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="min-h-screen p-10">
      <h1 className="text-3xl font-bold">
        LinkedIn Login Test
      </h1>

      {session?.user ? (
        <div className="mt-6">
          <p>
            Logged in as:
          </p>

          <p className="mt-2 text-xl font-bold">
            {session.user.name}
          </p>

          <p className="mt-2">
            {session.user.email}
          </p>

          {session.user.image && (
            <img
              src={session.user.image}
              alt={session.user.name || "Profile"}
              className="mt-4 h-20 w-20 rounded-full"
            />
          )}
        </div>
      ) : (
        <div className="mt-6">
          <p>Not logged in.</p>

          <a
            href="/login"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-3 text-white"
          >
            Login with LinkedIn
          </a>
        </div>
      )}
    </main>
  );
}
