import FeedbackReviewPanel from "../../../components/FeedbackReviewPanel";

export default function FeedbackReviewPage() {
  return (
    <section className="page feedback-page">
      <header className="page__header">
        <div>
          <h1 className="page__title">Feedback Review</h1>
          <p className="page__subtitle">Signed-in layout preferences and submitted alpha feedback.</p>
        </div>
      </header>
      <FeedbackReviewPanel />
    </section>
  );
}
