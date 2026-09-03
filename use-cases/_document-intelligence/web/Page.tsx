const COLLECTIONS = [
  { name: "document-intelligence__policies", documents: 1284 },
  { name: "document-intelligence__contracts", documents: 417 },
];

export default function Page() {
  const embeddingModel = process.env.NAI_EMBEDDING_MODEL;

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-stone-200 border-l-2 border-l-warning bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-charcoal-700">
          Beta
        </p>
        <p className="mt-2 max-w-[70ch] text-sm text-charcoal-900">
          Retrieval quality is still being tuned. Verify answers against the
          cited source before relying on them.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {COLLECTIONS.map((collection) => (
          <div
            key={collection.name}
            className="rounded-lg border border-stone-200 bg-white p-6"
          >
            <p className="font-mono text-xs text-charcoal-700">
              {collection.name}
            </p>
            <p className="tabular mt-3 font-serif text-4xl text-navy-900">
              {collection.documents.toLocaleString("en-US")}
            </p>
            <p className="mt-1 text-sm text-charcoal-700">Documents indexed</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-charcoal-700">
          Collection ownership
        </p>
        <p className="mt-3 max-w-[70ch] leading-relaxed text-charcoal-700">
          Both collections are prefixed with this use case&apos;s slug, which is
          the boundary that keeps it independent of everything else in the
          portal. Embeddings were produced by{" "}
          <code className="font-mono text-sm text-charcoal-900">
            {embeddingModel || "no configured embedding model"}
          </code>
          . Changing that model means re-embedding into a new collection rather
          than patching these.
        </p>
      </div>
    </section>
  );
}
