"use client";

export interface FaqDraft {
  question: string;
  answer: string;
}

const MAX_FAQS = 10;

/**
 * Optional AEO/GEO inputs shared by the Reporter ArticleForm and the Admin
 * ArticleEditor: a real Location for the story and author-written FAQs.
 * Collapsed by default (leaving both empty is the normal case) and nothing
 * is ever pre-filled or generated - the public page and its JSON-LD only
 * show a location / FAQPage when an author actually enters one here.
 */
export default function ArticleAeoGeoFields({
  location,
  onLocationChange,
  faqs,
  onFaqsChange,
}: {
  location: string;
  onLocationChange: (value: string) => void;
  faqs: FaqDraft[];
  onFaqsChange: (faqs: FaqDraft[]) => void;
}) {
  function updateFaq(index: number, patch: Partial<FaqDraft>) {
    onFaqsChange(faqs.map((faq, i) => (i === index ? { ...faq, ...patch } : faq)));
  }

  return (
    <details className="rounded-md border border-border-200 bg-surface-50/60 p-4" open={Boolean(location || faqs.length)}>
      <summary className="cursor-pointer text-sm font-semibold text-text-900">
        Answer &amp; location details (optional)
      </summary>
      <div className="mt-4 flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="field-label">
            Location <span className="font-normal text-text-400">(the real place this story is about, e.g. Mumbai, Maharashtra, India)</span>
          </span>
          <input
            type="text"
            value={location}
            maxLength={200}
            onChange={(e) => onLocationChange(e.target.value)}
            className="field-input"
            placeholder="Leave blank if the story has no specific place"
          />
        </label>

        <div className="flex flex-col gap-3">
          <span className="field-label">
            FAQs <span className="font-normal text-text-400">(only add questions readers genuinely ask - shown on the page and as FAQ structured data)</span>
          </span>
          {faqs.map((faq, index) => (
            <div key={index} className="flex flex-col gap-2 rounded-md border border-border-200 bg-white p-3">
              <input
                type="text"
                value={faq.question}
                maxLength={300}
                onChange={(e) => updateFaq(index, { question: e.target.value })}
                className="field-input"
                placeholder="Question"
                aria-label={`FAQ ${index + 1} question`}
              />
              <textarea
                value={faq.answer}
                maxLength={2000}
                onChange={(e) => updateFaq(index, { answer: e.target.value })}
                rows={2}
                className="field-input resize-y"
                placeholder="Answer (plain text)"
                aria-label={`FAQ ${index + 1} answer`}
              />
              <button
                type="button"
                onClick={() => onFaqsChange(faqs.filter((_, i) => i !== index))}
                className="btn-ghost self-start text-sm"
              >
                Remove FAQ
              </button>
            </div>
          ))}
          {faqs.length < MAX_FAQS && (
            <button
              type="button"
              onClick={() => onFaqsChange([...faqs, { question: "", answer: "" }])}
              className="btn-secondary self-start"
            >
              Add FAQ
            </button>
          )}
        </div>
      </div>
    </details>
  );
}
