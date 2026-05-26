import { Skeleton, SkeletonAvatar, SkeletonText } from "./Skeleton";

export { Skeleton, SkeletonAvatar, SkeletonText };

export function EventCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <Skeleton height={150} radius="lg" className="rounded-none" />
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Skeleton width="62%" height={16} />
          <Skeleton width={58} height={22} radius="full" />
        </div>
        <SkeletonText lines={2} />
        <div className="flex items-center justify-between pt-2">
          <Skeleton width={90} height={12} />
          <Skeleton width={72} height={28} radius="lg" />
        </div>
      </div>
    </div>
  );
}

export function EventListRowSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-4">
      <Skeleton width={74} height={54} radius="lg" className="shrink-0" />
      <div className="flex-1 min-w-0">
        <Skeleton width="50%" height={16} className="mb-2" />
        <Skeleton width="74%" height={12} />
      </div>
      <Skeleton width={78} height={24} radius="full" className="hidden sm:block" />
    </div>
  );
}

export function EventsPageSkeleton({ view = "grid" }: { view?: "grid" | "list" }) {
  if (view === "list") {
    return <div className="flex flex-col gap-3">{Array.from({ length: 5 }).map((_, i) => <EventListRowSkeleton key={i} />)}</div>;
  }
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">{Array.from({ length: 8 }).map((_, i) => <EventCardSkeleton key={i} />)}</div>;
}

export function OrganizationCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <SkeletonAvatar size={48} className="rounded-xl" />
        <div className="flex-1">
          <Skeleton width="70%" height={15} className="mb-2" />
          <Skeleton width="44%" height={12} />
        </div>
      </div>
      <SkeletonText lines={2} />
      <div className="flex justify-between items-center">
        <Skeleton width={82} height={22} radius="full" />
        <Skeleton width={62} height={12} />
      </div>
    </div>
  );
}

export function OrganizationsPageSkeleton() {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">{Array.from({ length: 8 }).map((_, i) => <OrganizationCardSkeleton key={i} />)}</div>;
}

export function TableRowsSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, row) => (
        <tr key={row}>
          {Array.from({ length: columns }).map((_, col) => (
            <td key={col}>
              <div className="flex items-center gap-2.5">
                {col === 0 && <SkeletonAvatar size={32} className="rounded-lg" />}
                <Skeleton width={col === 0 ? "70%" : "100%"} height={col === columns - 1 ? 26 : 13} radius={col === columns - 1 ? "lg" : "sm"} />
              </div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="card p-5"><Skeleton width={42} height={42} radius="xl" className="mb-4" /><Skeleton width="46%" height={24} className="mb-2" /><Skeleton width="70%" height={12} /></div>)}</div>
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_350px] gap-6">
        <div className="card overflow-hidden"><table className="table-base"><tbody><TableRowsSkeleton columns={5} /></tbody></table></div>
        <div className="card p-5 flex flex-col gap-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="flex gap-3"><SkeletonAvatar size={34} /><SkeletonText lines={2} className="flex-1" /></div>)}</div>
      </div>
      <div className="card overflow-hidden"><table className="table-base"><tbody><TableRowsSkeleton columns={6} rows={6} /></tbody></table></div>
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div><Skeleton width={160} height={28} className="mb-2" /><Skeleton width={420} height={14} /></div>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden"><Skeleton height={112} radius="sm" className="rounded-none" /><div className="px-6 pb-6"><Skeleton width={84} height={84} radius="xl" className="-mt-11 mb-4 border-4 border-white" /><Skeleton width="34%" height={24} className="mb-2" /><Skeleton width="46%" height={13} /></div></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded-xl border border-gray-200 bg-white px-4 py-3.5"><Skeleton width={48} height={24} className="mb-2" /><Skeleton width="78%" height={12} /></div>)}</div>
      <div className="flex flex-col lg:flex-row gap-5"><div className="flex-1 card p-5"><SkeletonText lines={9} /></div><div className="lg:w-[340px] card p-5"><SkeletonText lines={5} /></div></div>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-8 flex flex-col gap-5">
      <Skeleton width={150} height={14} />
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"><Skeleton height={120} className="rounded-none" /><div className="px-6 pb-6"><Skeleton width={84} height={84} radius="xl" className="-mt-10 mb-4 border-4 border-white" /><Skeleton width="45%" height={24} className="mb-3" /><SkeletonText lines={3} /></div></div>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-5"><div className="card p-5"><SkeletonText lines={7} /></div><div className="card p-5"><SkeletonText lines={6} /></div></div>
    </div>
  );
}

export function ManageFormSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div><Skeleton width={130} height={14} className="mb-3" /><Skeleton width={260} height={24} className="mb-2" /><Skeleton width={420} height={14} /></div>
      <div className="card p-5"><SkeletonText lines={6} /></div>
      <div className="card p-5"><SkeletonText lines={8} /></div>
    </div>
  );
}

export function ParticipantsPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div><Skeleton width={180} height={14} className="mb-3" /><Skeleton width={280} height={24} /></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card p-4"><Skeleton width={52} height={22} className="mb-2" /><Skeleton width="70%" height={12} /></div>)}</div>
      <div className="card overflow-hidden">
        <table className="table-base">
          <tbody>
            <TableRowsSkeleton columns={6} rows={6} />
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ManageMembersStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="card border-0">
          <div className="card-body py-4">
            <Skeleton width={48} height={28} className="mb-2" />
            <Skeleton width="62%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ManageMembersTableRowsSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, row) => (
        <tr key={row}>
          <td>
            <div className="flex items-center gap-2.5">
              <SkeletonAvatar size={32} />
              <div className="min-w-[180px] flex-1">
                <Skeleton width="65%" height={14} className="mb-2" />
                <Skeleton width="82%" height={11} />
              </div>
            </div>
          </td>
          <td><Skeleton width={92} height={13} radius="sm" /></td>
          <td><Skeleton width={86} height={13} radius="sm" /></td>
          <td><Skeleton width={54} height={13} radius="sm" /></td>
          <td><Skeleton width={78} height={13} radius="sm" /></td>
          <td><Skeleton width={86} height={30} radius="md" /></td>
          <td><Skeleton width={74} height={24} radius="full" /></td>
          <td><Skeleton width={54} height={30} radius="md" /></td>
        </tr>
      ))}
    </>
  );
}
