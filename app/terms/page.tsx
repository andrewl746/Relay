import { LegalPage, Section } from "@/components/legal-page";

export const metadata = { title: "Terms of service — Relay" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of service" updated="September 2026">
      <Section title="What Relay is">
        <p>
          Relay helps students at the same university find each other so one can
          lend, rent or sell an item to another. We introduce people and keep
          track of dates. We are not a party to whatever you agree between
          yourselves.
        </p>
      </Section>

      <Section title="We never handle your money">
        <p>
          Prices shown on Relay are set by the person listing the item. Payment
          happens directly between the two of you, by whatever method you both
          agree. Relay does not process, hold, escrow or refund payments, and we
          cannot reverse a transaction for you.
        </p>
      </Section>

      <Section title="Your account">
        <p>
          You need a valid university email to list or claim anything. Keep your
          account to yourself — you are responsible for what happens under it.
          You can delete your account at any time from the menu under your name,
          which removes your profile, your list and your listings.
        </p>
      </Section>

      <Section title="What you list">
        <p>
          Only list things you actually own and are allowed to lend or sell.
          Don&rsquo;t list anything illegal, unsafe, recalled, or prohibited by
          your university&rsquo;s residence rules. Describe items honestly,
          including damage.
        </p>
      </Section>

      <Section title="Borrowing and returning">
        <p>
          When you borrow something, you agree to return it in the condition you
          received it, by the date shown. Damage, loss and late returns are
          between you and the owner. We recommend photographing an item at
          handoff and at return.
        </p>
      </Section>

      <Section title="Meeting people">
        <p>
          Use your judgement. Meet in public where you can, bring someone if
          you&rsquo;d rather not go alone, and don&rsquo;t pay for anything you
          haven&rsquo;t seen. Relay verifies that someone holds a university
          email; it does not vet people.
        </p>
      </Section>

      <Section title="Liability">
        <p>
          Relay is provided as-is, without warranties. To the extent the law
          allows, we are not liable for loss, damage, injury or dispute arising
          from an exchange arranged through Relay.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          We may update these terms. If we change something significant
          we&rsquo;ll say so in the app rather than quietly editing this page.
        </p>
      </Section>
    </LegalPage>
  );
}
