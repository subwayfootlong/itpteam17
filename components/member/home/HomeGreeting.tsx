type HomeGreetingProps = {
  firstName: string;
  lastName?: string;
};

export default function HomeGreeting({
  firstName,
  lastName = "",
}: HomeGreetingProps) {
  const displayName = [firstName, lastName].filter(Boolean).join(" ");

  return (
    <section className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#0F6E00]">
        Assalamualaikum
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
        Welcome back,{" "}
        <span className="text-[#0F6E00]">{displayName || "Member"}</span>
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Here is what is happening in your community today.
      </p>
    </section>
  );
}
