import { LegalPage, Section } from "@/components/legal-page";

export const metadata = { title: "Privacy policy — Relay" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy" updated="September 2026">
      <Section title="What we collect">
        <p>
          Your name, your university, your university email, the area you live
          in, and what you list or ask for. If you sign in with Google we
          receive your name and email address from Google — nothing else.
        </p>
      </Section>

      <Section title="Why we collect it">
        <p>
          To show you things near you, to match what you need with what other
          people have, and to prove to the person you&rsquo;re meeting that
          you&rsquo;re a student at the same university. That&rsquo;s all.
        </p>
      </Section>

      <Section title="Your address">
        <p>
          We use your address to work out walking distance. Other students never
          see your exact address — they see an area, and they only get the
          precise location once you both agree to a handoff. If you live on
          campus we store your university&rsquo;s address instead of yours.
        </p>
      </Section>

      <Section title="What we don't do">
        <p>
          We don&rsquo;t sell your data, we don&rsquo;t run ads against it, and
          we don&rsquo;t share it with anyone outside the services we need to
          run the app. We never see or store payment details, because payments
          don&rsquo;t go through us.
        </p>
      </Section>

      <Section title="Who processes it">
        <p>
          Supabase stores your account and profile. Resend sends your
          verification email. If a page shows a map, Google serves it. Each sees
          only what it needs to do that job.
        </p>
      </Section>

      <Section title="Deleting your account">
        <p>
          Open the menu under your name and choose Delete account. This removes
          your profile, your list and your listings. It is immediate and cannot
          be undone.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about your data can go to the team through the repository
          this project was built in.
        </p>
      </Section>
    </LegalPage>
  );
}
