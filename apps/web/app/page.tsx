import Link from "next/link";
import { explanationLanguages } from "../lib/content";

export default function Home() {
  return (
    <main className="page">
      <h1>DeutschGo</h1>
      <p>Choose your explanation language · Выберите язык объяснений · Оберіть мову пояснень</p>
      <ul className="langs">
        {explanationLanguages().map((l) => (
          <li key={l.code}><Link href={`/${l.code}`}>{l.native_name}</Link></li>
        ))}
      </ul>
    </main>
  );
}
