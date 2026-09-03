import type { SharedResourceStatus } from "@/lib/types";

export function ResourceCard({
  status,
  consumers,
  showEnv = false,
}: {
  status: SharedResourceStatus;
  consumers?: string[];
  showEnv?: boolean;
}) {
  const { resource, configured, missing } = status;

  return (
    <div className="rounded-lg border border-hairline bg-ink-800 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fog-500">
            {resource.category}
          </p>
          <h3 className="mt-1 font-serif text-xl text-ivory-100">
            {resource.name}
          </h3>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-ivory-100 ${
            configured ? "bg-success/15" : "bg-critical/15"
          }`}
        >
          <span
            className={`size-1.5 rounded-full ${configured ? "bg-success" : "bg-critical"}`}
            aria-hidden
          />
          {configured ? "Configured" : "Not configured"}
        </span>
      </div>

      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-fog-300">
        {resource.summary}
      </p>

      {!configured && (
        <p className="mt-4 rounded-sm border-l-2 border-critical bg-critical/10 px-4 py-3 text-sm text-ivory-100">
          Missing configuration:{" "}
          <span className="font-mono text-xs">{missing.join(", ")}</span>
        </p>
      )}

      {showEnv && (
        <table className="mt-5 w-full text-left text-sm">
          <caption className="sr-only">
            Environment variables for {resource.name}
          </caption>
          <thead>
            <tr className="border-y border-hairline text-[10px] uppercase tracking-[0.12em] text-fog-500">
              <th scope="col" className="py-2 pr-4 font-semibold">
                Variable
              </th>
              <th scope="col" className="py-2 pr-4 font-semibold">
                Required
              </th>
              <th scope="col" className="py-2 font-semibold">
                Set
              </th>
            </tr>
          </thead>
          <tbody>
            {resource.env.map((variable) => (
              <tr
                key={variable.name}
                className="border-b border-hairline align-top"
              >
                <th scope="row" className="py-3 pr-4 font-normal">
                  <span className="font-mono text-xs text-ivory-100">
                    {variable.name}
                  </span>
                  {variable.secret && (
                    <span className="ml-2 rounded-sm bg-ink-950 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-fog-300">
                      Secret
                    </span>
                  )}
                  <span className="mt-1 block text-xs text-fog-300">
                    {variable.description}
                  </span>
                </th>
                <td className="py-3 pr-4 text-fog-300">
                  {variable.required ? "Yes" : "No"}
                </td>
                <td className="py-3 text-fog-300">
                  {process.env[variable.name] ? "Yes" : "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {consumers && (
        <p className="mt-5 border-t border-hairline pt-4 text-xs text-fog-500">
          {consumers.length > 0
            ? `Used by ${consumers.join(", ")}`
            : "Not used by any application yet"}
        </p>
      )}
    </div>
  );
}
