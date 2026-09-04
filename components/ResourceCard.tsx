import type { SharedResourceStatus } from "@/lib/types";
import { ResourceSettingsForm } from "@/components/ResourceSettingsForm";

export function ResourceCard({
  status,
  consumers,
  showEnv = false,
}: {
  status: SharedResourceStatus;
  consumers?: string[];
  showEnv?: boolean;
}) {
  const {
    resource,
    environmentVariables,
    storedVariables,
  } = status;

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-charcoal-700">
            {resource.category}
          </p>
          <h3 className="mt-1 font-serif text-xl text-navy-900">
            {resource.name}
          </h3>
        </div>
        <span
          className="inline-flex items-center gap-1.5 rounded-full bg-mist-100 px-2.5 py-1 text-xs font-semibold text-charcoal-700"
        >
          Browser-local
        </span>
      </div>

      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-charcoal-700">
        {resource.summary}
      </p>

      {showEnv && (
        <table className="mt-5 w-full text-left text-sm">
          <caption className="sr-only">
            Environment variables for {resource.name}
          </caption>
          <thead>
            <tr className="border-y border-stone-200 text-[10px] uppercase tracking-[0.12em] text-charcoal-700">
              <th scope="col" className="py-2 pr-4 font-semibold">
                Variable
              </th>
              <th scope="col" className="py-2 pr-4 font-semibold">
                Required
              </th>
              <th scope="col" className="py-2 font-semibold">
                Source
              </th>
            </tr>
          </thead>
          <tbody>
            {resource.env.map((variable) => (
              <tr
                key={variable.name}
                className="border-b border-stone-200 align-top"
              >
                <th scope="row" className="py-3 pr-4 font-normal">
                  <span className="font-mono text-xs text-navy-900">
                    {variable.name}
                  </span>
                  {variable.secret && (
                    <span className="ml-2 rounded-sm bg-mist-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-charcoal-700">
                      Secret
                    </span>
                  )}
                  <span className="mt-1 block text-xs text-charcoal-700">
                    {variable.description}
                  </span>
                </th>
                <td className="py-3 pr-4 text-charcoal-700">
                  {variable.required ? "Yes" : "No"}
                </td>
                <td className="py-3 text-charcoal-700">
                  Browser local storage
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showEnv && (
        <ResourceSettingsForm
          resourceId={resource.id}
          variables={resource.env}
          initialStored={storedVariables}
          environmentVariables={environmentVariables}
        />
      )}

      {consumers && (
        <p className="mt-5 border-t border-stone-200 pt-4 text-xs text-charcoal-700">
          {consumers.length > 0
            ? `Used by ${consumers.join(", ")}`
            : "Not used by any application yet"}
        </p>
      )}
    </div>
  );
}
