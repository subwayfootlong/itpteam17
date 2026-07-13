type HomeGreetingProps = {
  firstName: string;
  lastName?: string;
};

export default function HomeGreeting({
  firstName,
  lastName = "",
}: HomeGreetingProps) {
  return (
    <section>
      <h1 className="member-text-2xl text-3xl font-bold leading-tight text-[#151C27]">
        Assalamualaikum,
        <br />
        <span className="text-[#2EAE23]">
          {firstName}
          {lastName ? ` ${lastName}` : ""}
        </span>
      </h1>

      <p className="member-text-lg mt-3 text-lg leading-relaxed text-[#3F473F]">
        Welcome back to your community dashboard.
      </p>
    </section>
  );
}
