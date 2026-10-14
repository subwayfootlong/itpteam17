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
    <section>
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary-800">
        Assalamualaikum
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
        Welcome back,{" "}
        <span className="text-brand-primary-800">{displayName || "Member"}</span>
      </h1>
    </section>
  );
}
