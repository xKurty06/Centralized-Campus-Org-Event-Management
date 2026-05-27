import ManageShell from "@/components/ManageShell";

export default function ManageLayout({ children }: { children: React.ReactNode }) {
  return <ManageShell pageTitle="Salikop">{children}</ManageShell>;
}
