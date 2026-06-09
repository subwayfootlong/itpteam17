import BenefitsDirectory from "./components/benefits-directory";
import { membershipBenefits, partners } from "./data/partners";

export default function Home() {
  return (
    <BenefitsDirectory
      partners={partners}
      membershipBenefits={membershipBenefits}
    />
  );
}
