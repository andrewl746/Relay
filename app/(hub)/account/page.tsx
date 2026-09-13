import { PageShell, PageTitle } from "@/components/hub/ui";
import { getCurrentUser } from "@/lib/hub/session";
import { getWants } from "@/lib/hub/data";
import { snapshot, networkStats } from "@/lib/relay/store";

export const metadata = { title: "Account — Relay" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  const wants = await getWants(user.id);
  const snap = snapshot();
  const stats = networkStats(snap);
  const myItems = snap.data.items.filter(i => i.holderId === user.id);

  return (
    <PageShell>
      <PageTitle title="Account" lede="Your profile and routing statistics." />

      {/* Profile Card */}
      <div className="rounded-[4px] border border-[var(--bezel)] bg-[var(--panel)] p-6 mb-6">
        <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-[var(--text-muted)] mb-4">Profile</div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <div className="text-[12px] text-[var(--text-muted)]">Name</div>
            <div className="text-[15px] font-semibold">{user.name}</div>
          </div>
          <div>
            <div className="text-[12px] text-[var(--text-muted)]">Email</div>
            <div className="text-[15px] font-[family-name:var(--font-data)]">{user.email}</div>
          </div>
          <div>
            <div className="text-[12px] text-[var(--text-muted)]">Location</div>
            <div className="text-[15px] font-semibold">{user.home}</div>
          </div>
        </div>
      </div>

      {/* Network Stats */}
      <div className="rounded-[4px] border border-[var(--bezel)] bg-[var(--panel)] p-6 mb-6">
        <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-[var(--text-muted)] mb-4">Network Stats</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { value: stats.items, label: 'Items', color: 'var(--text-primary)' },
            { value: stats.earning, label: 'Earning', color: 'var(--active-route)' },
            { value: `$${stats.earned}`, label: 'Total Earned', color: 'var(--active-route)' },
            { value: stats.handoffs, label: 'Handoffs', color: 'var(--secured)' },
          ].map(s => (
            <div key={s.label} className="rounded-[2px] border border-[var(--bezel)] bg-[var(--chassis)] p-4 text-center">
              <div className="font-[family-name:var(--font-data)] text-[24px] font-semibold" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="mt-1 text-[11px] font-bold tracking-[0.14em] uppercase text-[var(--text-muted)]">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Needs */}
      <div className="rounded-[4px] border border-[var(--bezel)] bg-[var(--panel)] p-6 mb-6">
        <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-[var(--text-muted)] mb-4">
          Your Active Needs ({wants.length})
        </div>
        {wants.length === 0 ? (
          <p className="text-[14px] text-[var(--text-muted)]">No active needs. Post one from the board.</p>
        ) : (
          <div className="space-y-2">
            {wants.map(w => (
              <div key={w.id} className="flex items-center justify-between rounded-[2px] border border-[var(--bezel)] bg-[var(--chassis)] px-4 py-3">
                <span className="text-[14px]">{w.text}</span>
                <span className="font-[family-name:var(--font-data)] text-[12px] text-[var(--text-muted)]">{w.neededBy}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Your Items */}
      <div className="rounded-[4px] border border-[var(--bezel)] bg-[var(--panel)] p-6">
        <div className="text-[11px] font-bold tracking-[0.14em] uppercase text-[var(--text-muted)] mb-4">
          Your Items ({myItems.length})
        </div>
        {myItems.length === 0 ? (
          <p className="text-[14px] text-[var(--text-muted)]">You don&apos;t have any items listed.</p>
        ) : (
          <div className="space-y-2">
            {myItems.map(item => {
              const earned = snap.earnedOn(item);
              const idle = snap.idleOn(item);
              return (
                <div key={item.id} className="flex items-center justify-between rounded-[2px] border border-[var(--bezel)] bg-[var(--chassis)] px-4 py-3">
                  <div>
                    <span className="text-[14px]">{item.rawText.slice(0, 60)}</span>
                    <div className="flex gap-4 mt-1">
                      <span className="font-[family-name:var(--font-data)] text-[12px] text-[var(--active-route)]">${item.price}/{item.deal === 'sale' ? 'total' : 'day'}</span>
                      <span className="font-[family-name:var(--font-data)] text-[12px] text-[var(--secured)]">${earned} earned</span>
                      {idle > 0 && <span className="font-[family-name:var(--font-data)] text-[12px] text-[var(--alert)]">{idle}d idle</span>}
                    </div>
                  </div>
                  <span className="font-[family-name:var(--font-data)] text-[12px] text-[var(--text-muted)]">
                    {item.freeFrom} → {item.freeUntil}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
