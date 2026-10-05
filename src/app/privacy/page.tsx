export default function PrivacyPage() {
  return (
    <section className="page legal-page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Privacy</h1>
          <p className="page__subtitle">Optional marketing and trends policy, version aggregate-trends-v2</p>
        </div>
      </header>

      <p>This private-alpha page summarizes implemented controls. It is not yet the complete public-launch privacy notice.</p>

      <section>
        <h2>Core account data</h2>
        <p>OmniMediaTrak stores account identity, profile fields, tracking entries, list memberships, list-sharing grants, and security records needed to operate the service.</p>
      </section>
      <section>
        <h2>Trend participation</h2>
        <p>Participation is off by default. When enabled, aggregate calculations may use explicit ratings, self-declared coarse location, optional self-described race or ethnicity and gender, and an age band derived from the supplied birthday. Exact birthdays are not included in the analytics view. The service does not infer location or demographics from IP, GPS, device data, or media activity.</p>
      </section>
      <section>
        <h2>Aggregation controls</h2>
        <p>Local and preference results are suppressed until at least 20 opted-in participants qualify, and each displayed signal requires at least five people. Missing ratings are never interpreted as dislike.</p>
      </section>
      <section>
        <h2>Choices</h2>
        <p>Profile data can be corrected or cleared, consent can be withdrawn, account data can be downloaded, and the account can be deleted from the Account page. Withdrawal removes the account from future calculations while leaving the fields editable until the user clears them.</p>
      </section>
      <section>
        <h2>Alpha layout feedback</h2>
        <p>Anonymous filter-layout choices stay in the browser. For signed-in users, the service stores only the latest layout choice for aggregate comparison. Written feedback, and an optional contact email, is stored as a support request. Account export includes linked preference and support records; deleting an account removes its layout preference and linked layout-feedback submissions.</p>
      </section>
      <section>
        <h2>Sharing</h2>
        <p>A list is visible only to its owner and users the owner explicitly authorizes. Shared viewers do not receive private notes, ratings, progress, or tracking dates. OmniMediaTrak does not sell personal information or use list activity for cross-context behavioral advertising.</p>
      </section>
    </section>
  );
}
